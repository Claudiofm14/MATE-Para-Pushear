import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { AvanceEjercicio } from '../../entities/avance-ejercicio.entity';
import { Comision } from '../../entities/comision.entity';
import { Cursada } from '../../entities/cursada.entity';
import { Ejercicio } from '../../entities/ejercicio.entity';
import { Usuario } from '../../entities/usuario.entity';
import { SemanaService } from '../semana/semana.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';

export interface NodoAvance {
  id: number;
  titulo: string;
  descripcion: string;
  semanaId: number;
  numeroSemana: number;
  semanaTitulo: string;
  fechaEntrega?: string;
  recursoUrl?: string;
  recursoTitulo?: string;
  tipoActividad?: string;
  requisitos: number[];
  completadoEn: Date | null;
  estado: 'entregado' | 'pendiente' | 'bloqueado';
}

// Mantiene ramas paralelas cuando dos semanas tienen la misma cantidad de
// actividades. Al unir o abrir ramas, se requieren todos los pasos anteriores.
export function conectarSemanas(nodos: NodoAvance[]): NodoAvance[] {
  const grupos = new Map<number, NodoAvance[]>();
  for (const nodo of nodos) {
    const grupo = grupos.get(nodo.semanaId) || [];
    grupo.push(nodo);
    grupos.set(nodo.semanaId, grupo);
  }
  let anteriores: NodoAvance[] = [];
  for (const grupo of grupos.values()) {
    grupo.forEach((nodo, index) => {
      nodo.requisitos =
        anteriores.length === grupo.length
          ? [anteriores[index].id]
          : anteriores.map((anterior) => anterior.id);
    });
    anteriores = grupo;
  }
  const entregados = new Set(
    nodos.filter((nodo) => nodo.completadoEn).map((nodo) => nodo.id),
  );
  return nodos.map((nodo) => ({
    ...nodo,
    estado: nodo.completadoEn
      ? 'entregado'
      : nodo.requisitos.every((id) => entregados.has(id))
        ? 'pendiente'
        : 'bloqueado',
  }));
}

@Injectable()
export class AvanceService {
  constructor(
    @InjectRepository(Cursada)
    private readonly cursadaRepository: Repository<Cursada>,
    @InjectRepository(AlumnoMateria)
    private readonly inscripcionRepository: Repository<AlumnoMateria>,
    @InjectRepository(Comision)
    private readonly comisionRepository: Repository<Comision>,
    @InjectRepository(Ejercicio)
    private readonly ejercicioRepository: Repository<Ejercicio>,
    @InjectRepository(AvanceEjercicio)
    private readonly avanceRepository: Repository<AvanceEjercicio>,
    private readonly semanaService: SemanaService,
    private readonly profesorMateriaService: ProfesorMateriaService,
  ) {}

  private async resolverAcceso(
    cursadaId: number,
    usuario: Pick<Usuario, 'id' | 'rol'>,
    roles: string[],
    comisionSolicitada?: number,
  ) {
    const cursada = await this.cursadaRepository.findOne({
      where: { id: cursadaId },
      relations: ['materia'],
    });
    if (!cursada || cursada.materia.deletedAt || cursada.materia.archivada) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const simulacion =
      roles.includes(USER_ROLES.ADMIN) ||
      (roles.includes(USER_ROLES.DOCENTE) &&
        (await this.profesorMateriaService.verificarAccesoProfesor(
          usuario.id,
          cursada.materia.id,
        )));
    if (simulacion) {
      if (comisionSolicitada !== undefined) {
        const comision = await this.comisionRepository.findOne({
          where: { id: comisionSolicitada, cursada: { id: cursadaId } },
        });
        if (!comision) {
          throw new ForbiddenException(
            'La comisión no pertenece a esta cursada',
          );
        }
      }
      return { cursada, simulacion, comisionId: comisionSolicitada };
    }

    const inscripcion = await this.inscripcionRepository.findOne({
      where: {
        alumnoId: usuario.id,
        materiaId: cursada.materia.id,
        estado: 'aprobado',
        comision: { cursada: { id: cursadaId } },
      },
      relations: ['comision'],
    });
    if (!inscripcion || usuario.rol !== USER_ROLES.ALUMNO) {
      throw new ForbiddenException('No tienes acceso a esta cursada');
    }
    // Un alumno siempre usa su comisión, sin poder cambiarla por query string.
    return { cursada, simulacion: false, comisionId: inscripcion.comisionId };
  }

  async obtener(
    cursadaId: number,
    usuario: Pick<Usuario, 'id' | 'rol'>,
    roles: string[],
    comisionSolicitada?: number,
  ) {
    const acceso = await this.resolverAcceso(
      cursadaId,
      usuario,
      roles,
      comisionSolicitada,
    );
    const semanas = acceso.simulacion
      ? acceso.comisionId
        ? await this.semanaService.findByComision(acceso.comisionId)
        : await this.semanaService.findByCursada(cursadaId)
      : await this.semanaService.findVisiblesParaAlumno(
          cursadaId,
          acceso.comisionId!,
        );
    semanas.sort((a, b) => a.numeroSemana - b.numeroSemana || a.id - b.id);
    const semanaIds = semanas.map((semana) => semana.id);
    const [ejercicios, avance] = await Promise.all([
      semanaIds.length
        ? this.ejercicioRepository.find({
            where: { semana: { id: In(semanaIds) } },
            relations: ['semana'],
            order: { id: 'ASC' },
          })
        : Promise.resolve([]),
      acceso.simulacion
        ? Promise.resolve([])
        : this.avanceRepository.find({
            where: { alumnoId: usuario.id, cursadaId },
          }),
    ]);
    const completadas = new Map(
      avance.map((item) => [item.ejercicioId, item.completadoEn]),
    );
    const nodos: NodoAvance[] = semanas.flatMap((semana) =>
      ejercicios
        .filter((ejercicio) => ejercicio.semana.id === semana.id)
        .map((ejercicio) => ({
          id: ejercicio.id,
          titulo: ejercicio.titulo,
          descripcion: ejercicio.descripcion,
          semanaId: semana.id,
          numeroSemana: semana.numeroSemana,
          semanaTitulo: semana.titulo,
          fechaEntrega: ejercicio.fechaEntrega,
          recursoUrl:
            ejercicio.recursoUrl ||
            ejercicio.readmeUrl ||
            ejercicio.classroomUrl ||
            ejercicio.url,
          recursoTitulo: ejercicio.recursoTitulo,
          tipoActividad: ejercicio.tipoActividad,
          requisitos: [],
          completadoEn: completadas.get(ejercicio.id) || null,
          estado: 'pendiente' as const,
        })),
    );
    return {
      cursada: { id: acceso.cursada.id, titulo: acceso.cursada.titulo },
      materia: {
        id: acceso.cursada.materia.id,
        nombre: acceso.cursada.materia.nombre,
        codigo: acceso.cursada.materia.codigo,
      },
      comisionId: acceso.comisionId ?? null,
      simulacion: acceso.simulacion,
      nodos: conectarSemanas(nodos),
    };
  }

  async completar(
    cursadaId: number,
    ejercicioId: number,
    usuario: Pick<Usuario, 'id' | 'rol'>,
    roles: string[],
  ) {
    const mapa = await this.obtener(cursadaId, usuario, roles);
    if (mapa.simulacion) {
      throw new ForbiddenException('La simulación docente no guarda entregas');
    }
    const nodo = mapa.nodos.find((item) => item.id === ejercicioId);
    if (!nodo)
      throw new NotFoundException('Actividad no encontrada en tu cursada');
    if (nodo.estado === 'bloqueado') {
      throw new ForbiddenException(
        'Completa las actividades anteriores para habilitar esta entrega',
      );
    }
    if (nodo.estado !== 'entregado') {
      // ON CONFLICT DO NOTHING conserva la primera fecha ante reintentos.
      await this.avanceRepository
        .createQueryBuilder()
        .insert()
        .values({ alumnoId: usuario.id, cursadaId, ejercicioId })
        .orIgnore()
        .execute();
    }
    return this.obtener(cursadaId, usuario, roles);
  }

  async reiniciar(
    cursadaId: number,
    usuario: Pick<Usuario, 'id' | 'rol'>,
    roles: string[],
  ) {
    const acceso = await this.resolverAcceso(cursadaId, usuario, roles);
    if (acceso.simulacion) {
      throw new ForbiddenException(
        'La simulación docente no modifica entregas',
      );
    }
    await this.avanceRepository.delete({ alumnoId: usuario.id, cursadaId });
    return this.obtener(cursadaId, usuario, roles);
  }
}
