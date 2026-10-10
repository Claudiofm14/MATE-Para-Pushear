import { apiService } from '../shared/services/api.service';
import {
  ColumnMapping,
  StudentImportPreviewResponse,
} from './gitea-import.service';

export interface Usuario {
  id: number;
  authProviderId: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'alumno' | 'docente' | 'admin';
  githubUser?: string;
  activo: boolean;
  suspendidoAt?: string | null;
  suspendidoPorId?: number | null;
  suspensionMotivo?: string | null;
  ultimoAccesoAt?: string | null;
  materiasAlumno?: AlumnoMateria[];
  materiasProfesor?: ProfesorMateria[];
}

export interface GiteaAdminUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  htmlUrl: string;
  active: boolean;
  prohibitLogin: boolean;
  restricted: boolean;
  isAdmin: boolean;
  createdAt?: string | null;
  lastLoginAt?: string | null;
  platformUser?: Pick<
    Usuario,
    'id' | 'email' | 'nombre' | 'apellido' | 'rol'
  > | null;
}

export type UnifiedAdminUserRow = {
  key: string;
  platformUser?: Usuario;
  giteaUser?: GiteaAdminUser;
};

export type AdminUsuariosPagina = {
  items: UnifiedAdminUserRow[];
  total: number;
  page: number;
  limit: number;
  gitea?: {
    total: number;
    syncedAt: string | null;
    error: string | null;
  };
};

export type AdminUsuariosQuery = {
  page: number;
  limit: number;
  search?: string;
  rol?: 'todos' | Usuario['rol'];
  estado?: 'todos' | 'activo' | 'suspendido';
  refreshGitea?: boolean;
};

export interface GiteaUsersResponse {
  users: GiteaAdminUser[];
  total: number;
  syncedAt: string;
}

export interface AdminAuditLog {
  id: number;
  actorEmail?: string;
  targetEmail?: string;
  action:
    | 'user_role_updated'
    | 'user_suspended'
    | 'user_reactivated'
    | 'user_deleted'
    | 'user_teacher_assigned'
    | 'user_teacher_removed'
    | 'materia_created'
    | 'materia_updated'
    | 'materia_deleted'
    | 'materia_restored'
    | 'materia_archived'
    | 'materia_unarchived'
    | 'student_enrollment_updated'
    | 'delivery_updated'
    | 'gitea_import_executed'
    | 'gitea_password_updated'
    | 'student_list_exported'
    | 'maintenance_updated';
  title: string;
  detail?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  result: string;
  createdAt: string;
  actor?: Usuario;
  targetUser?: Usuario;
}

export interface MateriaResumen {
  id: number;
  nombre: string;
  codigo?: string | null;
}

export interface ProfesorMateria {
  id: number;
  profesorId: number;
  materiaId: number;
  materia?: MateriaResumen;
}

export interface AdminMetricas {
  usuariosActivos: number;
  usuariosSuspendidos: number;
  docentesPendientes: number;
  materiasActivas: number;
  entregasRecientes: number;
}

export interface AdminActivityStatistics {
  generatedAt: string;
  activeWindowMinutes: number;
  summary: {
    activeNow: number;
    usersToday: number;
    eventsToday: number;
    totalUsers: number;
  };
  usersOnline: Array<
    Pick<
      Usuario,
      'id' | 'nombre' | 'apellido' | 'email' | 'rol' | 'ultimoAccesoAt'
    >
  >;
  roles: Array<{ role: string; count: number }>;
  trend: Array<{ date: string; users: number; views: number }>;
  sections: Array<{
    label: string;
    path: string;
    views: number;
    users: number;
  }>;
  hourly: Array<{ hour: number; events: number; users: number }>;
  recent: Array<{
    id: number;
    kind: 'page_view' | 'action';
    label: string;
    path: string;
    createdAt: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    } | null;
  }>;
}

export interface AdminEstadoTecnico {
  status: 'ok' | 'degraded';
  version: string;
  timestamp: string;
  database: {
    ok: boolean;
    latencyMs: number | null;
    type: string;
  };
  gitea: {
    configured: boolean;
    baseUrl: string | null;
  };
  auth: {
    adminEmailsConfigured: boolean;
    secretConfigured: boolean;
  };
  data: {
    materias: number;
    auditoriaGlobal: number;
    auditoriaMaterias: number;
  };
}

export interface MaintenanceStatus {
  enabled: boolean;
  title: string;
  message: string;
  scheduledAt?: string | null;
  estimatedUntil?: string | null;
  updatedAt?: string;
}

export interface AlumnoMateria {
  id: number;
  alumnoId: number;
  materiaId: number;
  comisionId: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fechaInscripcion: Date;
  mensaje?: string;
  materia?: any;
  comision?: any;
  alumno?: Usuario;
}

export type AlumnoDisponibleResumen = Pick<
  Usuario,
  'id' | 'nombre' | 'apellido' | 'email' | 'githubUser'
>;

export interface AlumnosDisponiblesPage {
  items: AlumnoDisponibleResumen[];
  page: number;
  limit: number;
  total: number;
}

export type AltaAlumnosResultItem = {
  rowNumber: number;
  email: string;
  username: string;
  status: 'created' | 'updated' | 'exists' | 'error';
  message: string;
};

export type AltaAlumnosResultResponse = {
  ok: boolean;
  total: number;
  created: number;
  updated: number;
  exists: number;
  failed: number;
  results: AltaAlumnosResultItem[];
};

export type GiteaUserSyncResponse = {
  total: number;
  valid: number;
  created: number;
  updated: number;
  unchanged: number;
  syncedAt: string;
  skipped?: boolean;
};

export interface SolicitudInscripcionDto {
  materiaId: number;
  comisionId: number;
}

export interface AprobarSolicitudDto {
  mensaje?: string;
}

export interface RechazarSolicitudDto {
  mensaje?: string;
}

export interface EstadoInscripcion {
  estado: 'no_inscrito' | 'pendiente' | 'aprobado' | 'rechazado';
  inscripcion?: AlumnoMateria;
}

class UsuarioService {
  private baseUrl = '/api';
  private estadoInscripcionRequests = new Map<
    string,
    Promise<EstadoInscripcion>
  >();

  /**
   * Obtiene información del usuario autenticado
   */
  async obtenerUsuarioActual(): Promise<Usuario> {
    return await apiService.get<Usuario>(`${this.baseUrl}/usuario/me`);
  }

  /**
   * Solicita inscripción a una materia
   */
  async solicitarInscripcion(
    dto: SolicitudInscripcionDto
  ): Promise<AlumnoMateria> {
    return await apiService.post<AlumnoMateria>(
      `${this.baseUrl}/alumno/solicitar-inscripcion`,
      dto
    );
  }

  /**
   * Lista materias aprobadas del alumno
   */
  async obtenerMateriasAprobadas(): Promise<AlumnoMateria[]> {
    return await apiService.get<AlumnoMateria[]>(
      `${this.baseUrl}/alumno/mis-materias`
    );
  }

  /**
   * Lista solicitudes pendientes del alumno
   */
  async obtenerSolicitudesPendientes(): Promise<AlumnoMateria[]> {
    return await apiService.get<AlumnoMateria[]>(
      `${this.baseUrl}/alumno/mis-solicitudes`
    );
  }

  /**
   * Verifica el estado de inscripción en una materia
   */
  async verificarEstadoInscripcion(
    materiaId: number,
    cursadaId?: number
  ): Promise<EstadoInscripcion> {
    const requestKey = cursadaId ? `${materiaId}:${cursadaId}` : `${materiaId}`;
    const pending = this.estadoInscripcionRequests.get(requestKey);
    if (pending) return pending;

    const query = cursadaId ? `?cursadaId=${cursadaId}` : '';
    const request = apiService
      .get<EstadoInscripcion>(
        `${this.baseUrl}/alumno/materia/${materiaId}/estado${query}`
      )
      .finally(() => {
        this.estadoInscripcionRequests.delete(requestKey);
      });

    this.estadoInscripcionRequests.set(requestKey, request);
    return request;
  }

  /**
   * Lista materias del profesor
   */
  async obtenerMateriasProfesor(): Promise<any[]> {
    return await apiService.get<any[]>(`${this.baseUrl}/profesor/mis-materias`);
  }

  /**
   * Lista solicitudes pendientes de una materia (profesor)
   */
  async obtenerSolicitudesMateria(materiaId: number): Promise<AlumnoMateria[]> {
    return await apiService.get<AlumnoMateria[]>(
      `${this.baseUrl}/profesor/materia/${materiaId}/solicitudes`
    );
  }

  /**
   * Lista alumnos aprobados de una materia (profesor)
   */
  async obtenerAlumnosMateria(
    materiaId: number,
    cursadaId?: number
  ): Promise<AlumnoMateria[]> {
    const query = cursadaId ? `?cursadaId=${cursadaId}` : '';
    return await apiService.get<AlumnoMateria[]>(
      `${this.baseUrl}/profesor/materia/${materiaId}/alumnos${query}`
    );
  }

  async descargarAlumnosMateria(
    materiaId: number,
    cursadaId: number,
    format: 'csv' | 'xlsx',
    comisionId?: number | null
  ): Promise<Blob> {
    const params = new URLSearchParams({
      cursadaId: String(cursadaId),
      format,
    });
    if (comisionId) params.set('comisionId', String(comisionId));

    return apiService.get<Blob>(
      `${this.baseUrl}/profesor/materia/${materiaId}/alumnos/exportar?${params}`,
      { responseType: 'blob', timeout: 30000 }
    );
  }

  async obtenerAlumnosDisponiblesCursada(
    materiaId: number,
    cursadaId: number,
    search = '',
    page = 1,
    limit = 40
  ): Promise<AlumnosDisponiblesPage> {
    const params = new URLSearchParams({
      search,
      page: String(page),
      limit: String(limit),
    });
    return await apiService.get<AlumnosDisponiblesPage>(
      `${this.baseUrl}/profesor/materia/${materiaId}/cursada/${cursadaId}/alumnos-disponibles/buscar?${params}`
    );
  }

  async sincronizarAlumnosGitea(
    materiaId: number
  ): Promise<GiteaUserSyncResponse> {
    return await apiService.post<GiteaUserSyncResponse>(
      `${this.baseUrl}/profesor/materia/${materiaId}/sincronizar-alumnos-gitea`,
      {},
      { timeout: 60000 }
    );
  }

  async asignarAlumnoACursada(
    materiaId: number,
    alumnoId: number,
    comisionId: number
  ): Promise<AlumnoMateria> {
    return await apiService.post<AlumnoMateria>(
      `${this.baseUrl}/profesor/materia/${materiaId}/asignar-alumno-cursada`,
      { alumnoId, comisionId }
    );
  }

  async previsualizarAltaAlumnosMateria(
    materiaId: number,
    file: File,
    mapping?: ColumnMapping
  ): Promise<StudentImportPreviewResponse> {
    const formData = this.buildStudentImportFormData(file, mapping);
    return await apiService.post<StudentImportPreviewResponse>(
      `${this.baseUrl}/profesor/materia/${materiaId}/importar-alumnos/preview`,
      formData
    );
  }

  async confirmarAltaAlumnosMateria(
    materiaId: number,
    comisionId: number,
    file: File,
    mapping?: ColumnMapping
  ): Promise<AltaAlumnosResultResponse> {
    const formData = this.buildStudentImportFormData(file, mapping);
    formData.append('comisionId', String(comisionId));
    return await apiService.post<AltaAlumnosResultResponse>(
      `${this.baseUrl}/profesor/materia/${materiaId}/importar-alumnos/confirm`,
      formData
    );
  }

  private buildStudentImportFormData(file: File, mapping?: ColumnMapping) {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) formData.append('mapping', JSON.stringify(mapping));
    return formData;
  }

  /**
   * Lista alumnos de una comisión (profesor)
   */
  async obtenerAlumnosComision(comisionId: number): Promise<AlumnoMateria[]> {
    return await apiService.get<AlumnoMateria[]>(
      `${this.baseUrl}/profesor/comision/${comisionId}/alumnos`
    );
  }

  /**
   * Aprueba una solicitud de inscripción (profesor)
   */
  async aprobarSolicitud(
    solicitudId: number,
    dto?: AprobarSolicitudDto
  ): Promise<AlumnoMateria> {
    return await apiService.post<AlumnoMateria>(
      `${this.baseUrl}/profesor/aprobar-solicitud/${solicitudId}`,
      dto || {}
    );
  }

  /**
   * Rechaza una solicitud de inscripción (profesor)
   */
  async rechazarSolicitud(
    solicitudId: number,
    dto?: RechazarSolicitudDto
  ): Promise<AlumnoMateria> {
    return await apiService.post<AlumnoMateria>(
      `${this.baseUrl}/profesor/rechazar-solicitud/${solicitudId}`,
      dto || {}
    );
  }
  /**
   * Elimina una inscripción de alumno (profesor)
   */
  async eliminarAlumnoMateria(inscripcionId: number): Promise<void> {
    await apiService.delete(
      `${this.baseUrl}/profesor/alumno-materia/${inscripcionId}`
    );
  }

  /**
   * Elimina todos los alumnos de una materia (profesor)
   */
  async eliminarTodosAlumnosMateria(
    materiaId: number,
    cursadaId?: number
  ): Promise<void> {
    const query = cursadaId ? `?cursadaId=${cursadaId}` : '';
    await apiService.delete(
      `${this.baseUrl}/profesor/materia/${materiaId}/alumnos${query}`
    );
  }

  /**
   * Actualiza la comisión de un alumno (profesor)
   */
  async actualizarComisionAlumno(
    inscripcionId: number,
    comisionId: number
  ): Promise<AlumnoMateria> {
    return await apiService.put<AlumnoMateria>(
      `${this.baseUrl}/profesor/alumno-materia/${inscripcionId}/comision`,
      { comisionId }
    );
  }

  // ==================== SOLICITUDES DE ACCESO DOCENTE ====================

  async solicitarAccesoMateria(
    dto: SolicitarAccesoDto
  ): Promise<SolicitudAcceso> {
    return await apiService.post<SolicitudAcceso>(
      `${this.baseUrl}/profesor/solicitar-acceso`,
      dto
    );
  }

  async obtenerSolicitudesAcceso(): Promise<SolicitudAcceso[]> {
    return await apiService.get<SolicitudAcceso[]>(
      `${this.baseUrl}/admin/solicitudes-acceso`
    );
  }

  async obtenerUsuariosAdmin(
    query: AdminUsuariosQuery
  ): Promise<AdminUsuariosPagina> {
    const params = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit),
      search: query.search || '',
      rol: query.rol || 'todos',
      estado: query.estado || 'todos',
    });
    if (query.refreshGitea) params.set('refreshGitea', 'true');
    return await apiService.get<AdminUsuariosPagina>(
      `${this.baseUrl}/admin/usuarios?${params}`,
      { timeout: 30000 }
    );
  }

  async obtenerUsuariosGiteaAdmin(): Promise<GiteaUsersResponse> {
    return await apiService.get<GiteaUsersResponse>(
      `${this.baseUrl}/admin/gitea/usuarios`
    );
  }

  async actualizarPasswordGitea(
    username: string,
    password: string,
    mustChangePassword: boolean
  ): Promise<{
    username: string;
    mustChangePassword: boolean;
    updatedAt: string;
  }> {
    return await apiService.patch(
      `${this.baseUrl}/admin/gitea/usuarios/${encodeURIComponent(username)}/password`,
      { password, mustChangePassword }
    );
  }

  async obtenerMetricasAdmin(): Promise<AdminMetricas> {
    return await apiService.get<AdminMetricas>(
      `${this.baseUrl}/admin/metricas`
    );
  }

  async registrarActividad(
    kind: 'page_view' | 'presence',
    path: string
  ): Promise<void> {
    await apiService.post(`${this.baseUrl}/actividad/presencia`, {
      kind,
      path,
    });
  }

  async obtenerEstadisticasActividad(): Promise<AdminActivityStatistics> {
    return await apiService.get<AdminActivityStatistics>(
      `${this.baseUrl}/admin/estadisticas-actividad`
    );
  }

  async obtenerEstadoTecnico(): Promise<AdminEstadoTecnico> {
    return await apiService.get<AdminEstadoTecnico>(
      `${this.baseUrl}/admin/estado-tecnico`
    );
  }

  async obtenerMaintenanceStatus(): Promise<MaintenanceStatus> {
    return await apiService.get<MaintenanceStatus>(
      `${this.baseUrl}/maintenance`
    );
  }

  async actualizarMaintenanceStatus(
    data: Partial<MaintenanceStatus> & { enabled: boolean }
  ): Promise<MaintenanceStatus> {
    return await apiService.patch<MaintenanceStatus>(
      `${this.baseUrl}/admin/maintenance`,
      data
    );
  }

  async obtenerMateriasDisponibles(): Promise<MateriaResumen[]> {
    return await apiService.get<MateriaResumen[]>('/materia');
  }

  async obtenerDocenciasUsuario(usuarioId: number): Promise<ProfesorMateria[]> {
    return await apiService.get<ProfesorMateria[]>(
      `${this.baseUrl}/admin/usuarios/${usuarioId}/docencias`
    );
  }

  async asignarDocenciaUsuario(
    usuarioId: number,
    materiaId: number
  ): Promise<ProfesorMateria> {
    return await apiService.post<ProfesorMateria>(
      `${this.baseUrl}/admin/usuarios/${usuarioId}/docencias`,
      { materiaId }
    );
  }

  async quitarDocenciaUsuario(
    usuarioId: number,
    materiaId: number
  ): Promise<void> {
    await apiService.delete(
      `${this.baseUrl}/admin/usuarios/${usuarioId}/docencias/${materiaId}`
    );
  }

  async actualizarRolUsuario(
    usuarioId: number,
    rol: Usuario['rol']
  ): Promise<Usuario> {
    return await apiService.patch<Usuario>(
      `${this.baseUrl}/admin/usuarios/${usuarioId}/rol`,
      { rol }
    );
  }

  async suspenderUsuario(usuarioId: number, motivo?: string): Promise<Usuario> {
    return await apiService.patch<Usuario>(
      `${this.baseUrl}/admin/usuarios/${usuarioId}/suspender`,
      { motivo }
    );
  }

  async reactivarUsuario(usuarioId: number): Promise<Usuario> {
    return await apiService.patch<Usuario>(
      `${this.baseUrl}/admin/usuarios/${usuarioId}/reactivar`,
      {}
    );
  }

  async eliminarUsuario(usuarioId: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/admin/usuarios/${usuarioId}`);
  }

  async obtenerAuditoriaAdmin(limit = 100): Promise<AdminAuditLog[]> {
    return await apiService.get<AdminAuditLog[]>(
      `${this.baseUrl}/admin/auditoria?limit=${limit}`
    );
  }

  async aprobarSolicitudAcceso(id: number): Promise<void> {
    await apiService.post(
      `${this.baseUrl}/admin/solicitudes-acceso/${id}/aprobar`,
      {}
    );
  }

  async rechazarSolicitudAcceso(id: number): Promise<void> {
    await apiService.post(
      `${this.baseUrl}/admin/solicitudes-acceso/${id}/rechazar`,
      {}
    );
  }

  // ==================== GESTIÓN DE PROFESORES (ADMIN) ====================

  async obtenerProfesoresMateria(materiaId: number): Promise<any[]> {
    return await apiService.get<any[]>(
      `${this.baseUrl}/admin/materia/${materiaId}/profesores`
    );
  }

  async removerAsignacionProfesor(asignacionId: number): Promise<void> {
    await apiService.delete(
      `${this.baseUrl}/admin/remover-profesor/${asignacionId}`
    );
  }

  /**
   * Actualizar usuario de Gitea de un alumno (solo docentes)
   */
  async actualizarGithubUser(
    alumnoId: number,
    githubUser: string
  ): Promise<Usuario> {
    return await apiService.put<Usuario>(
      `${this.baseUrl}/profesor/alumno/${alumnoId}/gitea-user`,
      { giteaUser: githubUser }
    );
  }
}

export interface SolicitarAccesoDto {
  materiaId: number;
  comisionIds?: number[];
}

export interface SolicitudAcceso {
  id: number;
  docente: Usuario;
  materia: any; // Usar tipo Materia si está disponible
  comisionIds?: number[];
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  createdAt: string;
}

export const usuarioService = new UsuarioService();
