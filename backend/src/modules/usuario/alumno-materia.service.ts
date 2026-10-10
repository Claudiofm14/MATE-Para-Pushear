import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Materia } from '../../entities/materia.entity';
import { Comision } from '../../entities/comision.entity';
import { SolicitudInscripcionDto } from './dto';
import { getArgentinaDateString } from '../../config/timezone.config';
import { NormalizedStudent } from '../gitea/student-import.types';

export type AlumnoDisponibleResumen = Pick<
  Usuario,
  'id' | 'nombre' | 'apellido' | 'email' | 'githubUser'
>;

export type AlumnosDisponiblesPage = {
  items: AlumnoDisponibleResumen[];
  page: number;
  limit: number;
  total: number;
};

export type AlumnoExportRow = {
  legajo: string;
  nombre: string;
  apellido: string;
  email: string;
  gitea: string;
  comision: string;
};

@Injectable()
export class AlumnoMateriaService {
  constructor(
    @InjectRepository(AlumnoMateria)
    private readonly alumnoMateriaRepository: Repository<AlumnoMateria>,
    @InjectRepository(Materia)
    private readonly materiaRepository: Repository<Materia>,
    @InjectRepository(Comision)
    private readonly comisionRepository: Repository<Comision>,
  ) {}

  private cursadaAceptaAlumnos(comision: Comision): boolean {
    const cursada = comision.cursada;
    if (!cursada?.activa) return false;
    if (!cursada.fechaFin) return true;

    return cursada.fechaFin >= getArgentinaDateString();
  }

  /**
   * Solicita inscripción a una materia (estado: pendiente)
   */
  async solicitarInscripcion(
    alumno: Usuario,
    dto: SolicitudInscripcionDto,
  ): Promise<AlumnoMateria> {
    // Verificar que la materia existe
    const materia = await this.materiaRepository.findOne({
      where: { id: dto.materiaId },
    });

    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    // Verificar que la comisión existe y pertenece a la materia
    const comision = await this.comisionRepository.findOne({
      where: { id: dto.comisionId },
      relations: ['cursada', 'cursada.materia'],
    });

    if (!comision) {
      throw new NotFoundException('Comisión no encontrada');
    }

    if (comision.cursada.materia.id !== dto.materiaId) {
      throw new BadRequestException(
        'La comisión no pertenece a la materia seleccionada',
      );
    }

    // Verificar que no esté ya inscrito
    if (!this.cursadaAceptaAlumnos(comision)) {
      throw new BadRequestException(
        'La cursada seleccionada no se encuentra activa',
      );
    }

    const inscripcionesExistentes = await this.alumnoMateriaRepository.find({
      where: {
        alumnoId: alumno.id,
        materiaId: dto.materiaId,
      },
      relations: ['comision', 'comision.cursada'],
      order: { id: 'DESC' },
    });
    const inscripcionExistente = inscripcionesExistentes.find(
      (inscripcion) =>
        inscripcion.comision?.cursada?.id === comision.cursada.id,
    );

    if (inscripcionExistente) {
      if (inscripcionExistente.estado === 'pendiente') {
        throw new ConflictException(
          'Ya tienes una solicitud pendiente para esta materia',
        );
      }
      if (inscripcionExistente.estado === 'aprobado') {
        throw new ConflictException('Ya estás inscrito en esta materia');
      }
      // Si fue rechazado, permitir nueva solicitud
      if (inscripcionExistente.estado === 'rechazado') {
        inscripcionExistente.estado = 'pendiente';
        inscripcionExistente.comisionId = dto.comisionId;
        inscripcionExistente.mensaje = null;
        return await this.alumnoMateriaRepository.save(inscripcionExistente);
      }
    }

    // Crear nueva solicitud
    const solicitud = this.alumnoMateriaRepository.create({
      alumnoId: alumno.id,
      materiaId: dto.materiaId,
      comisionId: dto.comisionId,
      estado: 'pendiente',
    });

    return await this.alumnoMateriaRepository.save(solicitud);
  }

  /**
   * Lista materias aprobadas del alumno
   */
  async listarMateriasAprobadas(alumnoId: number): Promise<AlumnoMateria[]> {
    return await this.alumnoMateriaRepository.find({
      where: {
        alumnoId,
        estado: 'aprobado',
        materia: {
          archivada: false,
        },
        comision: {
          cursada: {
            activa: true,
          },
        },
      },
      relations: ['materia', 'comision', 'comision.cursada'],
    });
  }

  async verificarAccesoAlumno(
    alumnoId: number,
    materiaId: number,
  ): Promise<boolean> {
    const inscripcion = await this.alumnoMateriaRepository.findOne({
      where: {
        alumnoId,
        materiaId,
        estado: 'aprobado',
        materia: {
          archivada: false,
        },
        comision: {
          cursada: {
            activa: true,
          },
        },
      },
      relations: ['comision', 'comision.cursada'],
    });

    return !!inscripcion && this.cursadaAceptaAlumnos(inscripcion.comision);
  }

  async obtenerEstadoInscripcion(
    alumnoId: number,
    materiaId: number,
    cursadaId?: number,
  ): Promise<{
    estado: 'no_inscrito' | 'pendiente' | 'aprobado' | 'rechazado';
    inscripcion?: AlumnoMateria;
  }> {
    const query = this.alumnoMateriaRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.materia', 'materia')
      .leftJoinAndSelect('inscripcion.comision', 'comision')
      .leftJoinAndSelect('comision.cursada', 'cursada')
      .where('inscripcion.alumnoId = :alumnoId', { alumnoId })
      .andWhere('inscripcion.materiaId = :materiaId', { materiaId });

    if (cursadaId) {
      query.andWhere('cursada.id = :cursadaId', { cursadaId });
    } else {
      query.andWhere('cursada.activa = :activa', { activa: true });
    }

    const inscripciones = await query
      .orderBy('inscripcion.id', 'DESC')
      .getMany();

    const aprobada = inscripciones.find((i) => i.estado === 'aprobado');
    if (aprobada) {
      return { estado: 'aprobado', inscripcion: aprobada };
    }

    const pendiente = inscripciones.find((i) => i.estado === 'pendiente');
    if (pendiente) {
      return { estado: 'pendiente', inscripcion: pendiente };
    }

    const rechazada = inscripciones.find((i) => i.estado === 'rechazado');
    if (rechazada) {
      return { estado: 'rechazado', inscripcion: rechazada };
    }

    return { estado: 'no_inscrito' };
  }

  async verificarAccesoAlumnoCursada(
    alumnoId: number,
    cursadaId: number,
    comisionId?: number,
  ): Promise<boolean> {
    const query = this.alumnoMateriaRepository
      .createQueryBuilder('inscripcion')
      .leftJoin('inscripcion.comision', 'comision')
      .leftJoin('comision.cursada', 'cursada')
      .leftJoin('cursada.materia', 'materia')
      .where('inscripcion.alumnoId = :alumnoId', { alumnoId })
      .andWhere('inscripcion.estado = :estado', { estado: 'aprobado' })
      .andWhere('materia.archivada = false')
      .andWhere('cursada.id = :cursadaId', { cursadaId });

    if (comisionId) {
      query.andWhere('comision.id = :comisionId', { comisionId });
    }

    return (await query.getCount()) > 0;
  }

  /**
   * Lista solicitudes pendientes del alumno
   */
  async listarSolicitudesPendientes(
    alumnoId: number,
  ): Promise<AlumnoMateria[]> {
    return await this.alumnoMateriaRepository.find({
      where: {
        alumnoId,
        estado: 'pendiente',
        comision: {
          cursada: {
            activa: true,
          },
        },
      },
      relations: ['materia', 'comision', 'comision.cursada'],
    });
  }

  /**
   * Aprueba una solicitud de inscripción
   */
  async aprobarSolicitud(
    solicitudId: number,
    mensaje?: string,
  ): Promise<AlumnoMateria> {
    const solicitud = await this.alumnoMateriaRepository.findOne({
      where: { id: solicitudId },
      relations: ['alumno', 'materia', 'comision'],
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (solicitud.estado !== 'pendiente') {
      throw new BadRequestException('La solicitud ya fue procesada');
    }

    solicitud.estado = 'aprobado';
    solicitud.mensaje = mensaje;

    return await this.alumnoMateriaRepository.save(solicitud);
  }

  /**
   * Rechaza una solicitud de inscripción
   */
  async rechazarSolicitud(
    solicitudId: number,
    mensaje?: string,
  ): Promise<AlumnoMateria> {
    const solicitud = await this.alumnoMateriaRepository.findOne({
      where: { id: solicitudId },
      relations: ['alumno', 'materia', 'comision'],
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (solicitud.estado !== 'pendiente') {
      throw new BadRequestException('La solicitud ya fue procesada');
    }

    solicitud.estado = 'rechazado';
    solicitud.mensaje = mensaje;

    return await this.alumnoMateriaRepository.save(solicitud);
  }

  /**
   * Lista solicitudes pendientes para una materia
   */
  async listarSolicitudesPorMateria(
    materiaId: number,
  ): Promise<AlumnoMateria[]> {
    return this.alumnoMateriaRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.alumno', 'alumno')
      .leftJoinAndSelect('inscripcion.comision', 'comision')
      .leftJoin('comision.cursada', 'cursada')
      .select([
        'inscripcion.id',
        'inscripcion.alumnoId',
        'inscripcion.materiaId',
        'inscripcion.comisionId',
        'inscripcion.estado',
        'inscripcion.fechaInscripcion',
        'alumno.id',
        'alumno.nombre',
        'alumno.apellido',
        'alumno.email',
        'alumno.githubUser',
        'comision.id',
        'comision.nombre',
      ])
      .where('inscripcion.materiaId = :materiaId', { materiaId })
      .andWhere('inscripcion.estado = :estado', { estado: 'pendiente' })
      .andWhere('cursada.activa = :activa', { activa: true })
      .orderBy('inscripcion.fechaInscripcion', 'ASC')
      .getMany();
  }

  /**
   * Lista alumnos aprobados por materia
   */
  async listarAlumnosPorMateria(
    materiaId: number,
    cursadaId?: number,
  ): Promise<AlumnoMateria[]> {
    const query = this.alumnoMateriaRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.alumno', 'alumno')
      .leftJoinAndSelect('inscripcion.comision', 'comision')
      .leftJoinAndSelect('comision.cursada', 'cursada')
      .select([
        'inscripcion.id',
        'inscripcion.alumnoId',
        'inscripcion.materiaId',
        'inscripcion.comisionId',
        'inscripcion.estado',
        'inscripcion.fechaInscripcion',
        'alumno.id',
        'alumno.nombre',
        'alumno.apellido',
        'alumno.email',
        'alumno.githubUser',
        'comision.id',
        'comision.nombre',
        'cursada.id',
      ])
      .where('inscripcion.materiaId = :materiaId', { materiaId })
      .andWhere('inscripcion.estado = :estado', { estado: 'aprobado' });

    if (cursadaId) {
      query.andWhere('cursada.id = :cursadaId', { cursadaId });
    } else {
      query.andWhere('cursada.activa = :activa', { activa: true });
    }

    return await query
      .orderBy('alumno.apellido', 'ASC')
      .addOrderBy('alumno.nombre', 'ASC')
      .getMany();
  }

  async listarAlumnosParaExportar(
    materiaId: number,
    cursadaId: number,
    comisionId?: number,
  ): Promise<AlumnoExportRow[]> {
    const query = this.alumnoMateriaRepository
      .createQueryBuilder('inscripcion')
      .innerJoin('inscripcion.alumno', 'alumno')
      .innerJoin('inscripcion.comision', 'comision')
      .innerJoin('comision.cursada', 'cursada')
      .select("COALESCE(alumno.legajo, '')", 'legajo')
      .addSelect("COALESCE(alumno.nombre, '')", 'nombre')
      .addSelect("COALESCE(alumno.apellido, '')", 'apellido')
      .addSelect("COALESCE(alumno.email, '')", 'email')
      .addSelect('COALESCE(alumno."githubUser", \'\')', 'gitea')
      .addSelect("COALESCE(comision.nombre, '')", 'comision')
      .where('inscripcion.materiaId = :materiaId', { materiaId })
      .andWhere('inscripcion.estado = :estado', { estado: 'aprobado' })
      .andWhere('cursada.id = :cursadaId', { cursadaId });

    if (comisionId) {
      query.andWhere('comision.id = :comisionId', { comisionId });
    }

    return query
      .orderBy('comision.nombre', 'ASC')
      .addOrderBy('alumno.apellido', 'ASC')
      .addOrderBy('alumno.nombre', 'ASC')
      .getRawMany<AlumnoExportRow>();
  }

  async listarAlumnosDisponiblesParaCursada(
    materiaId: number,
    cursadaId: number,
  ): Promise<Usuario[]> {
    return await this.buildAlumnosDisponiblesQuery(materiaId, cursadaId)
      .select([
        'usuario.id',
        'usuario.nombre',
        'usuario.apellido',
        'usuario.email',
        'usuario.githubUser',
      ])
      .orderBy('usuario.apellido', 'ASC')
      .addOrderBy('usuario.nombre', 'ASC')
      .getMany();
  }

  async buscarAlumnosDisponiblesParaCursada(
    materiaId: number,
    cursadaId: number,
    options: { search?: string; page: number; limit: number },
  ): Promise<AlumnosDisponiblesPage> {
    const cursadaValida = await this.comisionRepository.exist({
      where: {
        cursada: {
          id: cursadaId,
          materia: { id: materiaId },
        },
      },
    });
    if (!cursadaValida) {
      throw new BadRequestException(
        'La cursada no pertenece a la materia seleccionada',
      );
    }

    const page = Math.max(1, options.page);
    const limit = Math.min(50, Math.max(1, options.limit));
    const query = this.buildAlumnosDisponiblesQuery(materiaId, cursadaId)
      .select([
        'usuario.id',
        'usuario.nombre',
        'usuario.apellido',
        'usuario.email',
        'usuario.githubUser',
      ])
      .orderBy('usuario.apellido', 'ASC')
      .addOrderBy('usuario.nombre', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const search = options.search?.trim();
    if (search) {
      const escaped = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query.andWhere(
        `CONCAT_WS(' ', usuario.nombre, usuario.apellido, usuario.email, usuario."githubUser") ILIKE :search`,
        { search: `%${escaped}%` },
      );
    }

    const [items, total] = await query.getManyAndCount();
    return { items, page, limit, total };
  }

  private buildAlumnosDisponiblesQuery(materiaId: number, cursadaId: number) {
    return this.materiaRepository.manager
      .getRepository(Usuario)
      .createQueryBuilder('usuario')
      .where('usuario.rol = :rol', { rol: 'alumno' })
      .andWhere('usuario.activo = :activo', { activo: true })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from(AlumnoMateria, 'inscripcion')
          .leftJoin('inscripcion.comision', 'comision')
          .leftJoin('comision.cursada', 'cursada')
          .where('inscripcion.alumnoId = usuario.id')
          .andWhere('inscripcion.materiaId = :materiaId')
          .andWhere('cursada.id = :cursadaId')
          .andWhere('inscripcion.estado = :estadoAprobado')
          .getQuery();

        return `NOT EXISTS ${subQuery}`;
      })
      .setParameters({ materiaId, cursadaId, estadoAprobado: 'aprobado' });
  }

  async asignarAlumnoACursada(
    alumnoId: number,
    materiaId: number,
    comisionId: number,
  ): Promise<AlumnoMateria> {
    const alumno = await this.materiaRepository.manager
      .getRepository(Usuario)
      .findOne({ where: { id: alumnoId } });

    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }

    const comision = await this.comisionRepository.findOne({
      where: { id: comisionId },
      relations: ['cursada', 'cursada.materia'],
    });

    if (!comision) {
      throw new NotFoundException('Comisión no encontrada');
    }

    if (comision.cursada.materia.id !== materiaId) {
      throw new BadRequestException(
        'La comisión no pertenece a la materia seleccionada',
      );
    }

    const inscripcionesExistentes = await this.alumnoMateriaRepository.find({
      where: { alumnoId, materiaId },
      relations: ['comision', 'comision.cursada'],
      order: { id: 'DESC' },
    });
    const existente = inscripcionesExistentes.find(
      (inscripcion) =>
        inscripcion.comision?.cursada?.id === comision.cursada.id,
    );

    if (existente?.comision?.cursada?.id === comision.cursada.id) {
      if (existente.estado === 'aprobado') {
        throw new ConflictException('El alumno ya tiene acceso a esta cursada');
      }

      existente.estado = 'aprobado';
      existente.comisionId = comisionId;
      existente.comision = comision;
      existente.mensaje = 'Acceso otorgado por docente';
      return await this.alumnoMateriaRepository.save(existente);
    }

    const inscripcion = this.alumnoMateriaRepository.create({
      alumnoId,
      materiaId,
      comisionId,
      estado: 'aprobado',
      mensaje: 'Acceso otorgado por docente',
    });

    return await this.alumnoMateriaRepository.save(inscripcion);
  }

  /**
   * Lista alumnos aprobados por comisión
   */
  async listarAlumnosPorComision(comisionId: number): Promise<AlumnoMateria[]> {
    return this.alumnoMateriaRepository
      .createQueryBuilder('inscripcion')
      .leftJoinAndSelect('inscripcion.alumno', 'alumno')
      .select([
        'inscripcion.id',
        'inscripcion.alumnoId',
        'inscripcion.materiaId',
        'inscripcion.comisionId',
        'inscripcion.estado',
        'inscripcion.fechaInscripcion',
        'alumno.id',
        'alumno.nombre',
        'alumno.apellido',
        'alumno.email',
        'alumno.githubUser',
      ])
      .where('inscripcion.comisionId = :comisionId', { comisionId })
      .andWhere('inscripcion.estado = :estado', { estado: 'aprobado' })
      .orderBy('alumno.apellido', 'ASC')
      .addOrderBy('alumno.nombre', 'ASC')
      .getMany();
  }

  async asignarAlumnosImportadosACursada(
    materiaId: number,
    comisionId: number,
    students: NormalizedStudent[],
  ) {
    const usuarioRepository =
      this.materiaRepository.manager.getRepository(Usuario);
    const results: Array<{
      rowNumber: number;
      email: string;
      username: string;
      status: 'created' | 'updated' | 'exists' | 'error';
      message: string;
    }> = [];

    for (const student of students) {
      try {
        let alumno = await usuarioRepository.findOne({
          where: { email: student.email },
        });
        const created = !alumno;

        if (!alumno) {
          alumno = usuarioRepository.create({
            email: student.email,
            nombre: student.firstName,
            apellido: student.lastName,
            rol: 'alumno',
            githubUser: student.username || null,
            legajo: student.legajo,
          });
        } else {
          alumno.nombre = alumno.nombre || student.firstName;
          alumno.apellido = alumno.apellido || student.lastName;
          alumno.githubUser = alumno.githubUser || student.username || null;
          alumno.legajo = student.legajo;
        }

        alumno = await usuarioRepository.save(alumno);
        await this.asignarAlumnoACursada(alumno.id, materiaId, comisionId);

        results.push({
          rowNumber: student.rowNumber,
          email: student.email,
          username: student.username,
          status: created ? 'created' : 'updated',
          message: created
            ? 'Usuario creado e inscrito'
            : 'Usuario existente inscrito',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error al inscribir alumno';

        results.push({
          rowNumber: student.rowNumber,
          email: student.email,
          username: student.username,
          status: message.includes('ya tiene acceso') ? 'exists' : 'error',
          message,
        });
      }
    }

    return {
      ok: true,
      total: students.length,
      created: results.filter((item) => item.status === 'created').length,
      updated: results.filter((item) => item.status === 'updated').length,
      exists: results.filter((item) => item.status === 'exists').length,
      failed: results.filter((item) => item.status === 'error').length,
      results,
    };
  }

  /**
   * Obtiene una inscripción por ID
   */
  async obtenerInscripcion(id: number): Promise<AlumnoMateria> {
    const inscripcion = await this.alumnoMateriaRepository.findOne({
      where: { id },
      relations: ['materia'],
    });

    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    return inscripcion;
  }
  /**
   * Elimina una inscripción de alumno
   */
  async eliminarAlumnoMateria(id: number): Promise<void> {
    const inscripcion = await this.alumnoMateriaRepository.findOne({
      where: { id },
    });

    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    await this.alumnoMateriaRepository.remove(inscripcion);
  }

  /**
   * Elimina todos los alumnos de una materia
   */
  async eliminarTodosAlumnosMateria(
    materiaId: number,
    cursadaId?: number,
  ): Promise<void> {
    const query = this.alumnoMateriaRepository
      .createQueryBuilder('inscripcion')
      .leftJoin('inscripcion.comision', 'comision')
      .leftJoin('comision.cursada', 'cursada')
      .where('inscripcion.materiaId = :materiaId', { materiaId })
      .andWhere('inscripcion.estado = :estado', { estado: 'aprobado' });

    if (cursadaId) {
      query.andWhere('cursada.id = :cursadaId', { cursadaId });
    } else {
      query.andWhere('cursada.activa = :activa', { activa: true });
    }

    const inscripciones = await query.getMany();

    if (inscripciones.length > 0) {
      await this.alumnoMateriaRepository.remove(inscripciones);
    }
  }

  /**
   * Actualiza la comisión de un alumno inscrito
   */
  async actualizarComision(
    inscripcionId: number,
    nuevaComisionId: number,
  ): Promise<AlumnoMateria> {
    const inscripcion = await this.alumnoMateriaRepository.findOne({
      where: { id: inscripcionId },
      relations: ['materia', 'comision', 'alumno'],
    });

    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    // Verificar que la nueva comisión existe
    const nuevaComision = await this.comisionRepository.findOne({
      where: { id: nuevaComisionId },
      relations: ['cursada', 'cursada.materia'],
    });

    if (!nuevaComision) {
      throw new NotFoundException('Comisión no encontrada');
    }

    // Verificar que la comisión pertenece a la misma materia
    if (nuevaComision.cursada.materia.id !== inscripcion.materiaId) {
      throw new BadRequestException(
        'La comisión no pertenece a la misma materia',
      );
    }

    // Actualizar la relación completa, no solo el ID
    inscripcion.comision = nuevaComision;
    inscripcion.comisionId = nuevaComisionId;

    return await this.alumnoMateriaRepository.save(inscripcion);
  }
}
