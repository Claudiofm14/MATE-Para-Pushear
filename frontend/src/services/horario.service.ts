import { apiClient } from './api.client';

export enum TipoHorario {
  PRESENCIAL = 'presencial',
  VIRTUAL = 'virtual',
}

export interface Horario {
  id: number;
  titulo: string;
  tipo: TipoHorario;
  detalle: string;
  url?: string | null;
  orden?: number;
  semanaId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateHorarioDto {
  titulo: string;
  tipo: TipoHorario;
  detalle: string;
  url?: string;
  semanaId: number;
}

export interface UpdateHorarioDto {
  titulo?: string;
  tipo?: TipoHorario;
  detalle?: string;
  /** null quita el enlace guardado; undefined lo deja como estaba. */
  url?: string | null;
  semanaId?: number;
}

export const horarioService = {
  /**
   * Obtener todos los horarios
   */
  async getAll(): Promise<Horario[]> {
    const response = await apiClient.get<Horario[]>('/horario');
    return response.data;
  },

  /**
   * Obtener un horario por ID
   */
  async getById(id: number): Promise<Horario> {
    const response = await apiClient.get<Horario>(`/horario/${id}`);
    return response.data;
  },

  /**
   * Obtener horarios por semana
   */
  async getBySemana(semanaId: number): Promise<Horario[]> {
    const response = await apiClient.get<Horario[]>(
      `/horario/semana/${semanaId}`
    );
    return response.data;
  },

  /**
   * Crear un nuevo horario
   */
  async create(data: CreateHorarioDto): Promise<Horario> {
    const response = await apiClient.post<Horario>('/horario', data);
    return response.data;
  },

  /**
   * Actualizar un horario existente
   */
  async update(id: number, data: UpdateHorarioDto): Promise<Horario> {
    const response = await apiClient.put<Horario>(`/horario/${id}`, data);
    return response.data;
  },

  /** Guardar el orden en que se muestran los horarios de una semana. */
  async reorder(semanaId: number, horarioIds: number[]): Promise<Horario[]> {
    const response = await apiClient.put<Horario[]>(
      `/horario/semana/${semanaId}/orden`,
      { horarioIds }
    );
    return response.data;
  },

  /**
   * Eliminar un horario (soft delete)
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/horario/${id}`);
  },
};

export default horarioService;
