import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntregaActividad } from '../../entities/entrega-actividad.entity';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { Actividad } from '../../entities/actividad.entity';
import { StudentExerciseRepository } from '../../entities/student-exercise-repository.entity';
import { UpdateEntregaDto } from './dto';

export interface PlanillaSeguimiento {
  actividades: Actividad[];
  alumnos: AlumnoConEntregas[];
}

export interface HistorialAlumno {
  alumno: AlumnoConEntregas;
  actividades: Array<{
    actividad: Actividad;
    entrega: EntregaActividad | null;
  }>;
}

export interface AlumnoConEntregas {
  id: number;
  nombre: string;
  apellido: string;
  githubUser: string;
  comision: {
    id: number;
    nombre: string;
  };
  entregas: { [actividadId: number]: EntregaActividad };
  giteaSummary?: {
    total: number;
    created: number;
    failed: number;
    withoutCommits: number;
    lastCommitAt?: Date | null;
    lastSyncedAt?: Date | null;
  };
}

@Injectable()
export class EntregaActividadService {
  constructor(
    @InjectRepository(EntregaActividad)
    private readonly entregaRepository: Repository<EntregaActividad>,
    @InjectRepository(AlumnoMateria)
    private readonly alumnoMateriaRepository: Repository<AlumnoMateria>,
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(StudentExerciseRepository)
    private readonly studentRepoRepository: Repository<StudentExerciseRepository>,
  ) {}

  /**
   * Obtener planilla completa de seguimiento para una materia
   */
  async obtenerPlanillaPorMateria(
    materiaId: number,
    cursadaId?: number,
    alumnoId?: number,
  ): Promise<PlanillaSeguimiento> {
    // Obtener actividades activas de la materia
    const actividadesPromise = (async () => {
      try {
        return await this.actividadRepository.find({
          where: { materiaId, activo: true },
          relations: ['comisiones'],
          order: { createdAt: 'ASC' },
        });
      } catch (error: any) {
        if (error?.code !== '42P01') throw error;

        return this.actividadRepository.find({
          where: { materiaId, activo: true },
          order: { createdAt: 'ASC' },
        });
      }
    })();

    // Obtener alumnos aprobados de la materia con sus comisiones
    const alumnosMateriaQuery = this.alumnoMateriaRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.alumno', 'alumno')
      .leftJoinAndSelect('inscripcion.comision', 'comision')
      .leftJoinAndSelect('comision.cursada', 'cursada')
      .select([
        'inscripcion.id',
        'alumno.id',
        'alumno.nombre',
        'alumno.apellido',
        'alumno.githubUser',
        'comision.id',
        'comision.nombre',
        'cursada.id',
      ])
      .where('inscripcion.materiaId = :materiaId', { materiaId })
      .andWhere('inscripcion.estado = :estado', { estado: 'aprobado' });

    if (cursadaId) {
      alumnosMateriaQuery.andWhere('cursada.id = :cursadaId', { cursadaId });
    } else {
      alumnosMateriaQuery.andWhere('cursada.activa = :activa', {
        activa: true,
      });
    }

    if (alumnoId) {
      alumnosMateriaQuery.andWhere('inscripcion.alumnoId = :alumnoId', {
        alumnoId,
      });
    }

    const alumnosPromise = alumnosMateriaQuery
      .orderBy('alumno.apellido', 'ASC')
      .addOrderBy('alumno.nombre', 'ASC')
      .getMany();

    const [actividades, alumnosMateria] = await Promise.all([
      actividadesPromise,
      alumnosPromise,
    ]);

    // Limitar entregas y repositorios a los alumnos de la cursada solicitada.
    const actividadIds = actividades.map((a) => a.id);
    const alumnoIds = alumnosMateria.map((am) => am.alumno.id);
    const entregasPromise =
      actividadIds.length && alumnoIds.length
        ? this.entregaRepository.find({
            where: {
              actividadId: In(actividadIds),
              alumnoId: In(alumnoIds),
            },
          })
        : Promise.resolve([]);

    const giteaSummaryPromise = alumnoIds.length
      ? this.obtenerResumenGitea(materiaId, alumnoIds, cursadaId)
      : Promise.resolve(new Map<number, AlumnoConEntregas['giteaSummary']>());

    const [entregas, giteaSummaryPorAlumno] = await Promise.all([
      entregasPromise,
      giteaSummaryPromise,
    ]);

    const entregasPorAlumno = new Map<number, EntregaActividad[]>();
    entregas.forEach((entrega) => {
      const entregasAlumno = entregasPorAlumno.get(entrega.alumnoId) || [];
      entregasAlumno.push(entrega);
      entregasPorAlumno.set(entrega.alumnoId, entregasAlumno);
    });

    // Construir matriz de alumnos con sus entregas
    const alumnos: AlumnoConEntregas[] = alumnosMateria.map((am) => {
      const entregasAlumno = entregasPorAlumno.get(am.alumno.id) || [];

      const entregasMap: { [actividadId: number]: EntregaActividad } = {};
      entregasAlumno.forEach((entrega) => {
        entregasMap[entrega.actividadId] = entrega;
      });

      return {
        id: am.alumno.id,
        nombre: am.alumno.nombre,
        apellido: am.alumno.apellido,
        githubUser: am.alumno.githubUser || '',
        comision: {
          id: am.comision?.id || 0,
          nombre: am.comision?.nombre || 'Sin comision',
        },
        entregas: entregasMap,
        giteaSummary: giteaSummaryPorAlumno.get(am.alumno.id) || {
          total: 0,
          created: 0,
          failed: 0,
          withoutCommits: 0,
          lastCommitAt: null,
          lastSyncedAt: null,
        },
      };
    });

    return {
      actividades,
      alumnos,
    };
  }

  private async obtenerResumenGitea(
    materiaId: number,
    alumnoIds: number[],
    cursadaId?: number,
  ): Promise<Map<number, AlumnoConEntregas['giteaSummary']>> {
    const rows = await this.studentRepoRepository
      .createQueryBuilder('repo')
      .innerJoin('repo.exercise', 'exercise')
      .innerJoin('exercise.semana', 'semana')
      .innerJoin('semana.cursada', 'cursada')
      .select('repo.studentId', 'studentId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE repo.status = 'created')`, 'created')
      .addSelect(
        `COUNT(*) FILTER (WHERE repo.status = 'failed' OR repo.syncStatus = 'failed')`,
        'failed',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE repo.status = 'created' AND repo.lastCommitAt IS NULL)`,
        'withoutCommits',
      )
      .addSelect('MAX(repo.lastCommitAt)', 'lastCommitAt')
      .addSelect('MAX(repo.lastSyncedAt)', 'lastSyncedAt')
      .where('cursada.materiaId = :materiaId', { materiaId })
      .andWhere(
        cursadaId ? 'cursada.id = :cursadaId' : 'cursada.activa = true',
        { cursadaId },
      )
      .andWhere('repo.studentId IN (:...alumnoIds)', { alumnoIds })
      .groupBy('repo.studentId')
      .getRawMany<{
        studentId: string;
        total: string;
        created: string;
        failed: string;
        withoutCommits: string;
        lastCommitAt: Date | null;
        lastSyncedAt: Date | null;
      }>();

    return new Map(
      rows.map((row) => [
        Number(row.studentId),
        {
          total: Number(row.total),
          created: Number(row.created),
          failed: Number(row.failed),
          withoutCommits: Number(row.withoutCommits),
          lastCommitAt: row.lastCommitAt,
          lastSyncedAt: row.lastSyncedAt,
        },
      ]),
    );
  }

  async exportarPlanillaCsv(
    materiaId: number,
    cursadaId?: number,
  ): Promise<string> {
    const planilla = await this.obtenerPlanillaPorMateria(materiaId, cursadaId);
    const headers = [
      'Nombre completo',
      'Usuario Gitea',
      'Comision',
      ...planilla.actividades.flatMap((actividad) => [
        `${actividad.nombre} - nota`,
        `${actividad.nombre} - comentario`,
      ]),
    ];

    const rows = planilla.alumnos.map((alumno) => [
      [alumno.nombre, alumno.apellido]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join(' ') ||
        alumno.githubUser ||
        'Sin nombre',
      alumno.githubUser,
      alumno.comision.nombre,
      ...planilla.actividades.flatMap((actividad) => {
        const entrega = alumno.entregas[actividad.id];
        if (!entrega) return ['', ''];

        const nota =
          actividad.tipoCalificacion === 'numerico'
            ? entrega.notaNumerica
            : entrega.notaConceptual;

        return [nota ?? '', entrega.comentario ?? ''];
      }),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(','))
      .join('\n');
  }

  async obtenerHistorialAlumno(
    materiaId: number,
    alumnoId: number,
    cursadaId?: number,
  ): Promise<HistorialAlumno> {
    const planilla = await this.obtenerPlanillaPorMateria(
      materiaId,
      cursadaId,
      alumnoId,
    );
    const alumno = planilla.alumnos.find((item) => item.id === alumnoId);

    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado en la planilla');
    }

    return {
      alumno,
      actividades: planilla.actividades.map((actividad) => ({
        actividad,
        entrega: alumno.entregas[actividad.id] || null,
      })),
    };
  }

  private escapeCsvCell(value: unknown): string {
    const text = String(value ?? '');
    if (!/[",\n\r]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
  }

  /**
   * Actualizar o crear entrega de un alumno
   */
  async actualizarEntrega(
    actividadId: number,
    alumnoId: number,
    dto: UpdateEntregaDto,
  ): Promise<EntregaActividad> {
    // Buscar si ya existe una entrega
    let entrega = await this.entregaRepository.findOne({
      where: { actividadId, alumnoId },
    });

    if (entrega) {
      // Actualizar existente
      Object.assign(entrega, dto);
    } else {
      // Crear nueva
      entrega = this.entregaRepository.create({
        actividadId,
        alumnoId,
        ...dto,
      });
    }

    return await this.entregaRepository.save(entrega);
  }

  /**
   * Actualizar múltiples entregas (bulk update)
   */
  async actualizarMultiples(
    entregas: Array<{
      actividadId: number;
      alumnoId: number;
      datos: UpdateEntregaDto;
    }>,
  ): Promise<void> {
    if (entregas.length === 0) return;

    const actividadIds = Array.from(
      new Set(entregas.map((e) => e.actividadId)),
    );
    const alumnoIds = Array.from(new Set(entregas.map((e) => e.alumnoId)));

    const existentes = await this.entregaRepository.find({
      where: {
        actividadId: In(actividadIds),
        alumnoId: In(alumnoIds),
      },
    });
    const existentesPorClave = new Map(
      existentes.map((entrega) => [
        `${entrega.actividadId}:${entrega.alumnoId}`,
        entrega,
      ]),
    );

    const entidades = entregas.map((item) => {
      const key = `${item.actividadId}:${item.alumnoId}`;
      const existente = existentesPorClave.get(key);
      if (existente) {
        Object.assign(existente, item.datos);
        return existente;
      }

      return this.entregaRepository.create({
        actividadId: item.actividadId,
        alumnoId: item.alumnoId,
        ...item.datos,
      });
    });

    await this.entregaRepository.save(entidades, { chunk: 500 });
  }
}
