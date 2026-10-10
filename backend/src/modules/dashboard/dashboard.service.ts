import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import {
  AdminAuditLog,
  AlumnoMateria,
  Actividad,
  Cursada,
  Ejercicio,
  EntregaActividad,
  Materia,
  MateriaLog,
  ProfesorMateria,
  Semana,
  SolicitudAccesoMateria,
  Usuario,
} from '../../entities/index.entity';
import { USER_ROLES } from '../../auth/constants/roles.constant';

type DashboardCard = {
  label: string;
  value: number;
  detail?: string;
};

type DashboardAction = {
  label: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
};

type DashboardNotification = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  type: 'info' | 'warning' | 'success';
  createdAt: Date;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: 'clase' | 'entrega';
  materiaId?: number;
  semanaId?: number;
  href?: string;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Materia)
    private readonly materiaRepository: Repository<Materia>,
    @InjectRepository(AlumnoMateria)
    private readonly alumnoMateriaRepository: Repository<AlumnoMateria>,
    @InjectRepository(ProfesorMateria)
    private readonly profesorMateriaRepository: Repository<ProfesorMateria>,
    @InjectRepository(SolicitudAccesoMateria)
    private readonly solicitudAccesoRepository: Repository<SolicitudAccesoMateria>,
    @InjectRepository(Cursada)
    private readonly cursadaRepository: Repository<Cursada>,
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(Ejercicio)
    private readonly ejercicioRepository: Repository<Ejercicio>,
    @InjectRepository(Semana)
    private readonly semanaRepository: Repository<Semana>,
    @InjectRepository(MateriaLog)
    private readonly materiaLogRepository: Repository<MateriaLog>,
    @InjectRepository(AdminAuditLog)
    private readonly adminAuditRepository: Repository<AdminAuditLog>,
    @InjectRepository(EntregaActividad)
    private readonly entregaRepository: Repository<EntregaActividad>,
  ) {}

  async getDashboard(usuario: Usuario) {
    const [cards, actions, notifications] = await Promise.all([
      this.getCards(usuario),
      this.getActions(usuario),
      this.getNotifications(usuario),
    ]);

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
      },
      cards,
      actions,
      notifications,
    };
  }

  async getNotifications(usuario: Usuario): Promise<DashboardNotification[]> {
    if (usuario.rol === USER_ROLES.ADMIN) {
      return this.getAdminNotifications();
    }

    if (usuario.rol === USER_ROLES.DOCENTE) {
      return this.getDocenteNotifications(usuario.id);
    }

    return this.getAlumnoNotifications(usuario.id);
  }

  async getCalendar(usuario: Usuario): Promise<CalendarEvent[]> {
    const cursadaIds = await this.getVisibleCursadaIds(usuario);
    if (cursadaIds.length === 0) return [];

    const [semanas, ejercicios] = await Promise.all([
      this.semanaRepository.find({
        where: { cursadaId: In(cursadaIds) },
        relations: ['cursada'],
        order: { fechaInicio: 'ASC' },
        take: 120,
      }),
      this.ejercicioRepository.find({
        where: { semana: { cursadaId: In(cursadaIds) } },
        relations: ['semana', 'semana.cursada'],
        order: { fechaEntrega: 'ASC' },
        take: 120,
      }),
    ]);

    const semanaEvents = semanas.map((semana) => ({
      id: `semana-${semana.id}`,
      title: semana.titulo,
      date: this.formatDate(semana.fechaInicio),
      type: 'clase' as const,
      materiaId: semana.cursada?.materiaId,
      semanaId: semana.id,
      href: semana.cursada?.materiaId
        ? `/materia/${semana.cursada.materiaId}/semanas/${semana.id}`
        : undefined,
    }));

    const entregaEvents = ejercicios
      .filter((ejercicio) => !!ejercicio.fechaEntrega)
      .map((ejercicio) => ({
        id: `ejercicio-${ejercicio.id}`,
        title: ejercicio.titulo,
        date: ejercicio.fechaEntrega!,
        type: 'entrega' as const,
        materiaId: ejercicio.semana?.cursada?.materiaId,
        semanaId: ejercicio.semana?.id,
        href: ejercicio.semana?.cursada?.materiaId
          ? `/materia/${ejercicio.semana.cursada.materiaId}/semanas/${ejercicio.semana.id}`
          : undefined,
      }));

    return [...semanaEvents, ...entregaEvents].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  private async getCards(usuario: Usuario): Promise<DashboardCard[]> {
    if (usuario.rol === USER_ROLES.ADMIN) {
      const [materias, usuarios, solicitudesDocentes, cursadasActivas] =
        await Promise.all([
          this.materiaRepository.count({ where: { archivada: false } }),
          this.alumnoMateriaRepository.manager.getRepository(Usuario).count(),
          this.solicitudAccesoRepository.count({
            where: { estado: 'pendiente' },
          }),
          this.cursadaRepository.count({ where: { activa: true } }),
        ]);

      return [
        { label: 'Materias', value: materias },
        { label: 'Usuarios', value: usuarios },
        {
          label: 'Solicitudes docentes',
          value: solicitudesDocentes,
          detail: 'Pendientes de aprobacion',
        },
        { label: 'Cursadas activas', value: cursadasActivas },
      ];
    }

    if (usuario.rol === USER_ROLES.DOCENTE) {
      const materiasProfesor = await this.profesorMateriaRepository.find({
        where: { profesorId: usuario.id, materia: { archivada: false } },
        relations: ['materia'],
      });
      const materiaIds = materiasProfesor.map((item) => item.materiaId);

      if (materiaIds.length === 0) {
        return [
          { label: 'Materias asignadas', value: 0 },
          { label: 'Solicitudes de alumnos', value: 0 },
          { label: 'Actividades', value: 0 },
          { label: 'Cambios recientes', value: 0 },
        ];
      }

      const [solicitudes, actividades, logs] = await Promise.all([
        this.alumnoMateriaRepository.count({
          where: { materiaId: In(materiaIds), estado: 'pendiente' },
        }),
        this.actividadRepository.count({
          where: { materiaId: In(materiaIds), activo: true },
        }),
        this.materiaLogRepository.count({
          where: { materiaId: In(materiaIds) },
        }),
      ]);

      return [
        { label: 'Materias asignadas', value: materiaIds.length },
        {
          label: 'Solicitudes de alumnos',
          value: solicitudes,
          detail: 'Pendientes de revision',
        },
        { label: 'Actividades', value: actividades },
        { label: 'Cambios recientes', value: logs },
      ];
    }

    const [materias, solicitudesPendientes] = await Promise.all([
      this.alumnoMateriaRepository.count({
        where: {
          alumnoId: usuario.id,
          estado: 'aprobado',
          materia: { archivada: false },
        },
      }),
      this.alumnoMateriaRepository.count({
        where: { alumnoId: usuario.id, estado: 'pendiente' },
      }),
    ]);

    const proximasEntregas = await this.getUpcomingExercisesForAlumno(
      usuario.id,
    );

    return [
      { label: 'Materias activas', value: materias },
      { label: 'Solicitudes pendientes', value: solicitudesPendientes },
      {
        label: 'Proximas entregas',
        value: proximasEntregas.length,
        detail: 'Con fecha asignada',
      },
    ];
  }

  private async getActions(usuario: Usuario): Promise<DashboardAction[]> {
    if (usuario.rol === USER_ROLES.ADMIN) {
      return [];
    }

    if (usuario.rol === USER_ROLES.DOCENTE) {
      const materia = await this.profesorMateriaRepository.findOne({
        where: { profesorId: usuario.id },
        order: { updatedAt: 'DESC' },
      });

      return [
        {
          label: 'Revisar solicitudes de alumnos',
          href: materia
            ? `/materia/${materia.materiaId}/mis-alumnos`
            : '/materias',
          priority: 'high',
        },
        {
          label: 'Actualizar planilla',
          href: materia
            ? `/materia/${materia.materiaId}/planilla-seguimiento`
            : '/materias',
          priority: 'medium',
        },
        {
          label: 'Publicar material o semana',
          href: materia ? `/materia/${materia.materiaId}/semanas` : '/materias',
          priority: 'medium',
        },
      ];
    }

    return [
      { label: 'Ver mis materias', href: '/materias', priority: 'high' },
      {
        label: 'Revisar proximas entregas',
        href: '/materias',
        priority: 'medium',
      },
    ];
  }

  private async getAdminNotifications(): Promise<DashboardNotification[]> {
    const [solicitudes, auditLogs] = await Promise.all([
      this.solicitudAccesoRepository.find({
        where: { estado: 'pendiente' },
        relations: ['docente', 'materia'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.adminAuditRepository.find({
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    const solicitudNotifications = solicitudes.map((solicitud) => ({
      id: `solicitud-docente-${solicitud.id}`,
      title: 'Solicitud docente pendiente',
      detail: `${this.formatUser(solicitud.docente)} pidio acceso a ${solicitud.materia?.nombre || 'una materia'}.`,
      href: '/admin/solicitudes',
      type: 'warning' as const,
      createdAt: solicitud.createdAt,
    }));

    const auditNotifications = auditLogs.map((log) => ({
      id: `admin-audit-${log.id}`,
      title: log.title || 'Actividad administrativa',
      detail: log.detail || log.action,
      href: '/admin/usuarios',
      type: 'info' as const,
      createdAt: log.createdAt,
    }));

    return [...solicitudNotifications, ...auditNotifications]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 12);
  }

  private async getDocenteNotifications(
    docenteId: number,
  ): Promise<DashboardNotification[]> {
    const materiasProfesor = await this.profesorMateriaRepository.find({
      where: { profesorId: docenteId },
    });
    const materiaIds = materiasProfesor.map((item) => item.materiaId);
    if (materiaIds.length === 0) return [];

    const [solicitudes, logs] = await Promise.all([
      this.alumnoMateriaRepository.find({
        where: { materiaId: In(materiaIds), estado: 'pendiente' },
        relations: ['alumno', 'materia'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.materiaLogRepository.find({
        where: { materiaId: In(materiaIds) },
        relations: ['materia'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    const solicitudNotifications = solicitudes.map((solicitud) => ({
      id: `solicitud-alumno-${solicitud.id}`,
      title: 'Solicitud de alumno pendiente',
      detail: `${this.formatUser(solicitud.alumno)} quiere inscribirse en ${solicitud.materia?.nombre || 'una materia'}.`,
      href: `/materia/${solicitud.materiaId}/mis-alumnos`,
      type: 'warning' as const,
      createdAt: solicitud.createdAt,
    }));

    const logNotifications = logs.map((log) => ({
      id: `log-${log.id}`,
      title: log.title || 'Cambio reciente',
      detail: `${log.resourceType}: ${log.detail || log.action}`,
      href: `/materia/${log.materiaId}/logs`,
      type: 'info' as const,
      createdAt: log.createdAt,
    }));

    return [...solicitudNotifications, ...logNotifications]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 12);
  }

  private async getAlumnoNotifications(
    alumnoId: number,
  ): Promise<DashboardNotification[]> {
    const inscripciones = await this.alumnoMateriaRepository.find({
      where: { alumnoId, estado: In(['aprobado', 'pendiente']) as any },
      relations: ['materia'],
      order: { updatedAt: 'DESC' },
      take: 10,
    });

    const [proximasEntregas, entregasCorregidas] = await Promise.all([
      this.getUpcomingExercisesForAlumno(alumnoId),
      this.entregaRepository.find({
        where: { alumnoId },
        relations: ['actividad'],
        order: { updatedAt: 'DESC' },
        take: 10,
      }),
    ]);

    const inscripcionNotifications = inscripciones.map((inscripcion) => ({
      id: `inscripcion-${inscripcion.id}`,
      title:
        inscripcion.estado === 'aprobado'
          ? 'Inscripcion aprobada'
          : 'Inscripcion pendiente',
      detail: `${inscripcion.materia?.nombre || 'Materia'}: ${inscripcion.estado}.`,
      href:
        inscripcion.estado === 'aprobado'
          ? `/materia/${inscripcion.materiaId}`
          : '/materias',
      type:
        inscripcion.estado === 'aprobado'
          ? ('success' as const)
          : ('info' as const),
      createdAt: inscripcion.updatedAt,
    }));

    const entregaNotifications = proximasEntregas.map((ejercicio) => ({
      id: `entrega-${ejercicio.id}`,
      title: 'Entrega proxima',
      detail: `${ejercicio.titulo} vence el ${ejercicio.fechaEntrega}.`,
      href: ejercicio.semana?.cursada?.materiaId
        ? `/materia/${ejercicio.semana.cursada.materiaId}/semanas/${ejercicio.semana.id}`
        : '/materias',
      type: 'warning' as const,
      createdAt: ejercicio.updatedAt,
    }));

    const correccionNotifications = entregasCorregidas.map((entrega) => ({
      id: `correccion-${entrega.id}`,
      title: 'Entrega corregida',
      detail: `${entrega.actividad?.nombre || 'Actividad'} tiene una correccion disponible.`,
      href: entrega.actividad?.materiaId
        ? `/materia/${entrega.actividad.materiaId}/planilla-seguimiento`
        : '/materias',
      type: 'success' as const,
      createdAt: entrega.updatedAt,
    }));

    return [
      ...correccionNotifications,
      ...entregaNotifications,
      ...inscripcionNotifications,
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 12);
  }

  private async getUpcomingExercisesForAlumno(
    alumnoId: number,
  ): Promise<Ejercicio[]> {
    const inscripciones = await this.alumnoMateriaRepository.find({
      where: { alumnoId, estado: 'aprobado' },
      relations: ['comision', 'comision.cursada'],
    });
    const cursadaIds = inscripciones
      .map((item) => item.comision?.cursada?.id)
      .filter(Boolean);

    if (cursadaIds.length === 0) return [];

    return this.ejercicioRepository.find({
      where: {
        fechaEntrega: MoreThanOrEqual(new Date().toISOString().slice(0, 10)),
        semana: { cursadaId: In(cursadaIds) },
      },
      relations: ['semana', 'semana.cursada'],
      order: { fechaEntrega: 'ASC' },
      take: 10,
    });
  }

  private async getVisibleCursadaIds(usuario: Usuario): Promise<number[]> {
    if (usuario.rol === USER_ROLES.ADMIN) {
      const cursadas = await this.cursadaRepository.find({
        where: { activa: true },
        select: ['id'],
      });
      return cursadas.map((cursada) => cursada.id);
    }

    if (usuario.rol === USER_ROLES.DOCENTE) {
      const materias = await this.profesorMateriaRepository.find({
        where: { profesorId: usuario.id },
      });
      const materiaIds = materias.map((item) => item.materiaId);
      if (materiaIds.length === 0) return [];

      const cursadas = await this.cursadaRepository.find({
        where: { materiaId: In(materiaIds), activa: true },
        select: ['id'],
      });
      return cursadas.map((cursada) => cursada.id);
    }

    const inscripciones = await this.alumnoMateriaRepository.find({
      where: { alumnoId: usuario.id, estado: 'aprobado' },
      relations: ['comision', 'comision.cursada'],
    });

    return inscripciones
      .map((item) => item.comision?.cursada?.id)
      .filter(Boolean);
  }

  private formatDate(value: Date | string): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  }

  private formatUser(usuario?: Usuario) {
    if (!usuario) return 'Un usuario';
    const fullName = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
    return fullName || usuario.email || usuario.githubUser || 'Un usuario';
  }
}
