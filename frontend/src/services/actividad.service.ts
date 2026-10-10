import { apiService } from '../shared/services/api.service';

export interface Actividad {
  id: number;
  nombre: string;
  descripcion?: string;
  repositorioBase: string;
  tipoCalificacion: 'numerico' | 'conceptual';
  materiaId: number;
  activo: boolean;
  comisiones?: {
    id: number;
    nombre: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface EntregaActividad {
  id: number;
  actividadId: number;
  alumnoId: number;
  notaNumerica?: number;
  notaConceptual?: string;
  comentario?: string;
  updatedAt: string;
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
    lastCommitAt?: string | null;
    lastSyncedAt?: string | null;
  };
}

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

export interface CreateActividadDto {
  nombre: string;
  descripcion?: string | null;
  repositorioBase: string;
  tipoCalificacion: 'numerico' | 'conceptual';
  materiaId: number;
  comisionIds?: number[];
}

export interface UpdateActividadDto {
  nombre?: string;
  /** null limpia la descripcion guardada; undefined la deja como estaba. */
  descripcion?: string | null;
  repositorioBase?: string;
  tipoCalificacion?: 'numerico' | 'conceptual';
  activo?: boolean;
  comisionIds?: number[];
}

export interface UpdateEntregaDto {
  notaNumerica?: number;
  notaConceptual?: string;
  comentario?: string;
}

class ActividadService {
  private baseUrl = '/api';

  /**
   * Crear nueva actividad
   */
  async crearActividad(dto: CreateActividadDto): Promise<Actividad> {
    return await apiService.post<Actividad>(`${this.baseUrl}/actividad`, dto);
  }

  /**
   * Listar actividades de una materia
   */
  async listarActividadesPorMateria(materiaId: number): Promise<Actividad[]> {
    return await apiService.get<Actividad[]>(
      `${this.baseUrl}/materia/${materiaId}/actividades`
    );
  }

  /**
   * Actualizar actividad
   */
  async actualizarActividad(
    id: number,
    dto: UpdateActividadDto
  ): Promise<Actividad> {
    return await apiService.put<Actividad>(
      `${this.baseUrl}/actividad/${id}`,
      dto
    );
  }

  /**
   * Eliminar actividad
   */
  async eliminarActividad(id: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/actividad/${id}`);
  }

  /**
   * Obtener planilla de seguimiento completa
   */
  async obtenerPlanillaSeguimiento(
    materiaId: number,
    cursadaId?: number
  ): Promise<PlanillaSeguimiento> {
    const query = cursadaId ? `?cursadaId=${cursadaId}` : '';
    return await apiService.get<PlanillaSeguimiento>(
      `${this.baseUrl}/materia/${materiaId}/planilla-seguimiento${query}`
    );
  }

  async exportarPlanillaSeguimiento(
    materiaId: number,
    cursadaId?: number
  ): Promise<Blob> {
    const query = cursadaId ? `?cursadaId=${cursadaId}` : '';
    const response = await apiService
      .getAxiosInstance()
      .get(
        `${this.baseUrl}/materia/${materiaId}/planilla-seguimiento/export${query}`,
        { responseType: 'blob' }
      );
    return response.data;
  }

  async obtenerHistorialAlumno(
    materiaId: number,
    alumnoId: number,
    cursadaId?: number
  ): Promise<HistorialAlumno> {
    const query = cursadaId ? `?cursadaId=${cursadaId}` : '';
    return apiService.get<HistorialAlumno>(
      `${this.baseUrl}/materia/${materiaId}/alumno/${alumnoId}/historial${query}`
    );
  }

  /**
   * Actualizar entrega de un alumno
   */
  async actualizarEntrega(
    actividadId: number,
    alumnoId: number,
    dto: UpdateEntregaDto
  ): Promise<EntregaActividad> {
    return await apiService.put<EntregaActividad>(
      `${this.baseUrl}/entrega-actividad/${actividadId}/${alumnoId}`,
      dto
    );
  }

  /**
   * Actualizar múltiples entregas
   */
  async actualizarMultiplesEntregas(
    entregas: Array<{
      actividadId: number;
      alumnoId: number;
      entrega: UpdateEntregaDto;
    }>
  ): Promise<void> {
    await apiService.put(`${this.baseUrl}/entrega-actividad/bulk`, entregas);
  }
}

export const actividadService = new ActividadService();
