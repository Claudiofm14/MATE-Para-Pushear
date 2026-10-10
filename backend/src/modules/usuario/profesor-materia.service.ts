import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProfesorMateria } from '../../entities/profesor-materia.entity';
import { ProfesorComision } from '../../entities/profesor-comision.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Materia } from '../../entities/materia.entity';
import { Comision } from '../../entities/comision.entity';
import { SolicitudAccesoMateria } from '../../entities/solicitud-acceso-materia.entity';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { AsignacionProfesorDto, SolicitarAccesoDto } from './dto';

@Injectable()
export class ProfesorMateriaService {
  constructor(
    @InjectRepository(ProfesorMateria)
    private readonly profesorMateriaRepository: Repository<ProfesorMateria>,
    @InjectRepository(ProfesorComision)
    private readonly profesorComisionRepository: Repository<ProfesorComision>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Materia)
    private readonly materiaRepository: Repository<Materia>,
    @InjectRepository(Comision)
    private readonly comisionRepository: Repository<Comision>,
    @InjectRepository(SolicitudAccesoMateria)
    private readonly solicitudRepository: Repository<SolicitudAccesoMateria>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Asigna un profesor a una materia completa (solo admin)
   */
  async asignarProfesor(dto: AsignacionProfesorDto): Promise<ProfesorMateria> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el profesor existe
      const profesor = await queryRunner.manager.findOne(Usuario, {
        where: { authProviderId: dto.profesorAuthProviderId },
      });

      if (!profesor) {
        throw new NotFoundException('Profesor no encontrado');
      }

      // Verificar que la materia existe
      const materia = await queryRunner.manager.findOne(Materia, {
        where: { id: dto.materiaId },
      });

      if (!materia) {
        throw new NotFoundException('Materia no encontrada');
      }

      const comisionIds = [];

      // Verificar que las comisiones existen
      const comisiones =
        comisionIds.length > 0
          ? await queryRunner.manager.find(Comision, {
              where: comisionIds.map((id) => ({ id })),
              relations: ['cursada', 'cursada.materia'],
            })
          : [];

      if (comisiones.length !== comisionIds.length) {
        throw new NotFoundException(
          'Una o más comisiones no fueron encontradas',
        );
      }

      // Verificar que todas las comisiones pertenecen a la materia
      const comisionesInvalidas = comisiones.filter(
        (c) => c.cursada.materia.id !== dto.materiaId,
      );

      if (comisionesInvalidas.length > 0) {
        throw new NotFoundException(
          'Una o más comisiones no pertenecen a la materia',
        );
      }

      // Verificar si ya existe una asignación
      let profesorMateria = await queryRunner.manager.findOne(ProfesorMateria, {
        where: {
          profesorId: profesor.id,
          materiaId: dto.materiaId,
        },
      });

      if (!profesorMateria) {
        // Crear nueva asignación si no existe
        profesorMateria = queryRunner.manager.create(ProfesorMateria, {
          profesorId: profesor.id,
          materiaId: dto.materiaId,
        });
        profesorMateria = await queryRunner.manager.save(profesorMateria);
        // Si el usuario actualmente es 'alumno', promoverlo a 'docente' globalmente
        if (profesor.rol === 'alumno') {
          profesor.rol = 'docente';
          await queryRunner.manager.save(profesor);
        }
      } else {
        // Si existe, eliminar las comisiones existentes para reescribirlas
        await queryRunner.manager.delete(ProfesorComision, {
          profesorMateriaId: profesorMateria.id,
        });
      }

      if (profesor.rol === 'alumno') {
        profesor.rol = 'docente';
        await queryRunner.manager.save(profesor);
      }

      // Crear relaciones con comisiones
      const profesorComisiones = comisionIds.map((comisionId) =>
        queryRunner.manager.create(ProfesorComision, {
          profesorMateriaId: profesorMateria.id,
          comisionId,
        }),
      );

      if (profesorComisiones.length > 0) {
        await queryRunner.manager.save(profesorComisiones);
      }

      await queryRunner.manager.delete(AlumnoMateria, {
        alumnoId: profesor.id,
        materiaId: dto.materiaId,
      });

      await queryRunner.commitTransaction();

      // Retornar la entidad completa con relaciones
      return await this.profesorMateriaRepository.findOne({
        where: { id: profesorMateria.id },
        relations: ['profesor', 'materia', 'comisiones', 'comisiones.comision'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async asignarProfesorPorUsuarioId(
    profesorId: number,
    materiaId: number,
  ): Promise<ProfesorMateria> {
    const profesor = await this.usuarioRepository.findOne({
      where: { id: profesorId },
    });
    if (!profesor) throw new NotFoundException('Profesor no encontrado');

    const materia = await this.materiaRepository.findOne({
      where: { id: materiaId },
    });
    if (!materia) throw new NotFoundException('Materia no encontrada');

    let asignacion = await this.profesorMateriaRepository.findOne({
      where: { profesorId, materiaId },
      relations: ['materia', 'comisiones', 'comisiones.comision'],
    });

    if (!asignacion) {
      asignacion = await this.profesorMateriaRepository.save(
        this.profesorMateriaRepository.create({ profesorId, materiaId }),
      );
    }

    if (profesor.rol === 'alumno') {
      profesor.rol = 'docente';
      await this.usuarioRepository.save(profesor);
    }

    await this.dataSource.getRepository(AlumnoMateria).delete({
      alumnoId: profesorId,
      materiaId,
    });

    return await this.profesorMateriaRepository.findOne({
      where: { id: asignacion.id },
      relations: ['profesor', 'materia', 'comisiones', 'comisiones.comision'],
    });
  }

  /**
   * Lista materias del profesor
   */
  async listarMateriasPorProfesor(
    profesorId: number,
  ): Promise<ProfesorMateria[]> {
    return await this.profesorMateriaRepository.find({
      where: { profesorId, materia: { archivada: false } },
      relations: ['materia', 'comisiones', 'comisiones.comision'],
    });
  }

  /**
   * Lista profesores de una materia (admin)
   */
  async listarProfesoresPorMateria(
    materiaId: number,
  ): Promise<ProfesorMateria[]> {
    return await this.profesorMateriaRepository.find({
      where: { materiaId },
      relations: ['profesor', 'comisiones', 'comisiones.comision'],
    });
  }

  /**
   * Verifica si un profesor tiene acceso a una materia
   */
  async verificarAccesoProfesor(
    profesorId: number,
    materiaId: number,
  ): Promise<boolean> {
    const asignacion = await this.profesorMateriaRepository.findOne({
      where: {
        profesorId,
        materiaId,
        // Una materia archivada solo es accesible para un admin.
        materia: { archivada: false },
      },
    });

    return !!asignacion;
  }

  /**
   * Verifica si un profesor tiene acceso a una comisión
   */
  async verificarAccesoComision(
    profesorId: number,
    comisionId: number,
  ): Promise<boolean> {
    const comision = await this.comisionRepository.findOne({
      where: { id: comisionId },
      relations: ['cursada', 'cursada.materia'],
    });

    if (!comision?.cursada?.materia) {
      return false;
    }

    return await this.verificarAccesoProfesor(
      profesorId,
      comision.cursada.materia.id,
    );
  }

  /**
   * Elimina asignación de profesor (solo admin)
   */
  async removerAsignacion(asignacionId: number): Promise<void> {
    const asignacion = await this.profesorMateriaRepository.findOne({
      where: { id: asignacionId },
    });

    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada');
    }

    const profesorId = asignacion.profesorId;

    await this.profesorMateriaRepository.remove(asignacion);

    // Si está habilitado, bajar rol a 'alumno' si ya no tiene asignaciones
    try {
      const allowRoleDowngrade =
        process.env.AUTH_ALLOW_ROLE_DOWNGRADE === 'true';
      if (allowRoleDowngrade) {
        const restantes = await this.profesorMateriaRepository.count({
          where: { profesorId },
        });
        if (restantes === 0) {
          const profesor = await this.usuarioRepository.findOne({
            where: { id: profesorId },
          });
          if (profesor && profesor.rol === 'docente') {
            profesor.rol = 'alumno';
            await this.usuarioRepository.save(profesor);
          }
        }
      }
    } catch (err) {
      // no bloquear la eliminación si falla la degradación; solo loguear en futuro
    }
  }

  async removerAsignacionPorUsuarioMateria(
    profesorId: number,
    materiaId: number,
  ): Promise<void> {
    const asignacion = await this.profesorMateriaRepository.findOne({
      where: { profesorId, materiaId },
    });

    if (!asignacion) {
      throw new NotFoundException('Asignacion no encontrada');
    }

    await this.removerAsignacion(asignacion.id);
  }

  /**
   * Solicita acceso a una materia (docente)
   */
  async solicitarAcceso(
    usuario: Usuario,
    dto: SolicitarAccesoDto,
  ): Promise<SolicitudAccesoMateria> {
    // Verificar materia
    const materia = await this.materiaRepository.findOne({
      where: { id: dto.materiaId },
    });
    if (!materia) throw new NotFoundException('Materia no encontrada');

    // Verificar si ya tiene acceso
    const tieneAcceso = await this.verificarAccesoProfesor(
      usuario.id,
      dto.materiaId,
    );
    if (tieneAcceso) {
      throw new ConflictException('Ya tienes acceso a esta materia');
    }

    // Verificar si ya tiene solicitud pendiente
    const solicitudExistente = await this.solicitudRepository.findOne({
      where: {
        docente: { id: usuario.id },
        materia: { id: dto.materiaId },
        estado: 'pendiente',
      },
    });

    if (solicitudExistente) {
      throw new ConflictException(
        'Ya tienes una solicitud pendiente para esta materia',
      );
    }

    const solicitud = this.solicitudRepository.create({
      docente: usuario,
      materia,
      comisionIds: dto.comisionIds || [],
      estado: 'pendiente',
    });

    return await this.solicitudRepository.save(solicitud);
  }

  /**
   * Lista todas las solicitudes pendientes (admin)
   */
  async listarSolicitudesPendientes(): Promise<SolicitudAccesoMateria[]> {
    return await this.solicitudRepository.find({
      where: { estado: 'pendiente' },
      relations: ['docente', 'materia'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Aprueba una solicitud de acceso (admin)
   */
  async aprobarSolicitudAcceso(solicitudId: number): Promise<void> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id: solicitudId },
      relations: ['docente', 'materia'],
    });

    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.estado !== 'pendiente') {
      throw new BadRequestException('La solicitud ya fue procesada');
    }

    // Asignar profesor
    await this.asignarProfesor({
      profesorAuthProviderId: solicitud.docente.authProviderId,
      materiaId: solicitud.materia.id,
    });

    solicitud.estado = 'aprobado';
    await this.solicitudRepository.save(solicitud);
  }

  /**
   * Rechaza una solicitud de acceso (admin)
   */
  async rechazarSolicitudAcceso(solicitudId: number): Promise<void> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id: solicitudId },
    });

    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.estado !== 'pendiente') {
      throw new BadRequestException('La solicitud ya fue procesada');
    }

    solicitud.estado = 'rechazado';
    await this.solicitudRepository.save(solicitud);
  }
}
