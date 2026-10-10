import { apiClient } from './api.client';

export interface Comision {
  id: number;
  nombre: string;
  descripcion?: string;
  cursadaId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateComisionDto {
  nombre: string;
  descripcion?: string;
  cursadaId: number;
}

export interface UpdateComisionDto {
  nombre?: string;
  descripcion?: string;
  cursadaId?: number;
}

export const comisionService = {
  /**
   * Obtener todas las comisiones
   */
  async getAll(): Promise<Comision[]> {
    const response = await apiClient.get<Comision[]>('/comision');
    return response.data;
  },

  /**
   * Obtener una comisión por ID
   */
  async getById(id: number): Promise<Comision> {
    const response = await apiClient.get<Comision>(`/comision/${id}`);
    return response.data;
  },

  /**
   * Obtener comisiones por cursada
   */
  async getByCursada(cursadaId: number): Promise<Comision[]> {
    const response = await apiClient.get<Comision[]>(
      `/comision/cursada/${cursadaId}`
    );
    return response.data;
  },

  /**
   * Obtener comisiones disponibles para que un alumno solicite inscripcion.
   */
  async getByCursadaForInscripcion(cursadaId: number): Promise<Comision[]> {
    const response = await apiClient.get<Comision[]>(
      `/comision/cursada/${cursadaId}/inscripcion`
    );
    return response.data;
  },

  /**
   * Obtener comisiones disponibles para que un alumno solicite inscripcion.
   */
  async getByMateriaForInscripcion(materiaId: number): Promise<Comision[]> {
    const response = await apiClient.get<Comision[]>(
      `/comision/materia/${materiaId}/inscripcion`
    );
    return response.data;
  },

  /**
   * Crear una nueva comisión
   */
  async create(data: CreateComisionDto): Promise<Comision> {
    const response = await apiClient.post<Comision>('/comision', data);
    return response.data;
  },

  /**
   * Actualizar una comisión existente
   */
  async update(id: number, data: UpdateComisionDto): Promise<Comision> {
    const response = await apiClient.put<Comision>(`/comision/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar una comisión (soft delete)
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/comision/${id}`);
  },
};

export default comisionService;
