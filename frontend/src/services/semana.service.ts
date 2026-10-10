import { apiClient } from './api.client';
import { Comision } from './comision.service';
import { MaterialContent } from '../types/content-blocks';
import type { Video } from './video.service';
import type { Ejercicio } from './ejercicio.service';
import type { Horario } from './horario.service';

export interface Semana {
  id: number;
  titulo: string;
  descripcion?: string;
  numeroSemana: number;
  fechaInicio: string;
  horaInicio?: string;
  fechasClasePorComision?: Record<string, string>;
  importante?: string;
  avisos?: string;
  contenido?: MaterialContent;
  cursadaId: number;
  cursada?: {
    id: number;
    titulo?: string;
    materiaId?: number;
    deletedAt?: string | null;
  };
  comisiones?: Comision[];
  // Solo vienen pobladas en la respuesta de getById(): el detalle de una
  // semana trae todo su contenido en una sola consulta para no forzar al
  // que lo consume a pedirlas de nuevo por separado.
  videos?: Video[];
  ejercicios?: Ejercicio[];
  horarios?: Horario[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateSemanaDto {
  titulo: string;
  descripcion?: string;
  numeroSemana: number;
  fechaInicio: string;
  horaInicio?: string;
  fechasClasePorComision?: Record<string, string>;
  importante?: string;
  avisos?: string;
  contenido?: MaterialContent;
  cursadaId: number;
  comisionIds?: number[];
}

export interface UpdateSemanaDto {
  titulo?: string;
  descripcion?: string;
  numeroSemana?: number;
  fechaInicio?: string;
  horaInicio?: string;
  fechasClasePorComision?: Record<string, string>;
  importante?: string;
  avisos?: string;
  contenido?: MaterialContent;
  cursadaId?: number;
  comisionIds?: number[];
}

export const semanaService = {
  /**
   * Obtener todas las semanas
   */
  async getAll(): Promise<Semana[]> {
    const response = await apiClient.get<Semana[]>('/semana');
    return response.data;
  },

  /**
   * Obtener una semana por ID
   */
  async getById(id: number): Promise<Semana> {
    const response = await apiClient.get<Semana>(`/semana/${id}`);
    return response.data;
  },

  /** Obtener el detalle sólo si sería visible para la comisión indicada. */
  async getStudentPreview(id: number, comisionId: number): Promise<Semana> {
    const response = await apiClient.get<Semana>(
      `/semana/${id}/vista-alumno/${comisionId}`
    );
    return response.data;
  },

  /**
   * Obtener semanas por cursada
   */
  async getByCursada(cursadaId: number): Promise<Semana[]> {
    const response = await apiClient.get<Semana[]>(
      `/semana/cursada/${cursadaId}`
    );
    return response.data;
  },

  /**
   * Obtener semanas por comisión
   */
  async getByComision(comisionId: number): Promise<Semana[]> {
    const response = await apiClient.get<Semana[]>(
      `/semana/comision/${comisionId}`
    );
    return response.data;
  },

  /**
   * Crear una nueva semana
   */
  async create(data: CreateSemanaDto): Promise<Semana> {
    const response = await apiClient.post<Semana>('/semana', data);
    return response.data;
  },

  /**
   * Actualizar una semana existente
   */
  async update(id: number, data: UpdateSemanaDto): Promise<Semana> {
    const response = await apiClient.put<Semana>(`/semana/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar una semana (soft delete)
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/semana/${id}`);
  },

  /**
   * Restaurar una semana eliminada
   */
  async restore(id: number): Promise<Semana> {
    const response = await apiClient.patch<Semana>(`/semana/${id}/restore`);
    return response.data;
  },

  async duplicate(id: number): Promise<Semana> {
    const response = await apiClient.post<Semana>(`/semana/${id}/duplicate`);
    return response.data;
  },

  /**
   * Obtener semanas visibles para un alumno
   * Filtra por comisión y fecha/hora de publicación
   */
  async getVisiblesParaAlumno(
    cursadaId: number,
    comisionId: number
  ): Promise<Semana[]> {
    const response = await apiClient.get<Semana[]>(
      `/semana/cursada/${cursadaId}/alumno/${comisionId}`
    );
    return response.data;
  },
};

export default semanaService;
