import { apiClient } from './api.client';

export interface ContratoPedagogico {
  id: number;
  materiaId: number;
  contenedores?: ContenedorContrato[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ContenedorContrato {
  id: number;
  titulo: string;
  contenido: string;
  orden: number;
}

export interface CreateContratoPedagogicoDto {
  materiaId: number;
}

export interface UpdateContratoPedagogicoDto {
  materiaId?: number;
}

export interface CreateContenedorDto {
  titulo: string;
  contenido: string;
  orden: number;
}

export const contratoPedagogicoService = {
  /**
   * Obtener todos los contratos pedagógicos
   */
  async getAll(): Promise<ContratoPedagogico[]> {
    const response = await apiClient.get<ContratoPedagogico[]>(
      '/contrato-pedagogico'
    );
    return response.data;
  },

  /**
   * Obtener un contrato pedagógico por ID
   */
  async getById(id: number): Promise<ContratoPedagogico> {
    const response = await apiClient.get<ContratoPedagogico>(
      `/contrato-pedagogico/${id}`
    );
    return response.data;
  },

  /**
   * Obtener las secciones de un contrato pedagógico
   */
  async getSecciones(id: number): Promise<ContenedorContrato[]> {
    const response = await apiClient.get<ContenedorContrato[]>(
      `/contrato-pedagogico/${id}/secciones`
    );
    return response.data;
  },

  /**
   * Crear un nuevo contrato pedagógico
   */
  async create(data: CreateContratoPedagogicoDto): Promise<ContratoPedagogico> {
    const response = await apiClient.post<ContratoPedagogico>(
      '/contrato-pedagogico',
      data
    );
    return response.data;
  },

  /**
   * Actualizar un contrato pedagógico existente
   */
  async update(
    id: number,
    data: UpdateContratoPedagogicoDto
  ): Promise<ContratoPedagogico> {
    const response = await apiClient.put<ContratoPedagogico>(
      `/contrato-pedagogico/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar un contrato pedagógico (soft delete)
   */
  async delete(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/contrato-pedagogico/${id}`
    );
    return response.data;
  },

  /**
   * Restaurar un contrato pedagógico eliminado
   */
  async restore(id: number): Promise<ContratoPedagogico> {
    const response = await apiClient.patch<ContratoPedagogico>(
      `/contrato-pedagogico/${id}`
    );
    return response.data;
  },

  /**
   * Agregar un contenedor (sección) a un contrato pedagógico
   */
  async addContenedor(
    id: number,
    data: CreateContenedorDto
  ): Promise<ContratoPedagogico> {
    const response = await apiClient.post<ContratoPedagogico>(
      `/contrato-pedagogico/${id}/contenedores`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar un contenedor de un contrato pedagógico
   */
  async removeContenedor(
    id: number,
    contenedorId: number
  ): Promise<ContratoPedagogico> {
    const response = await apiClient.delete<ContratoPedagogico>(
      `/contrato-pedagogico/${id}/contenedores/${contenedorId}`
    );
    return response.data;
  },
};

export default contratoPedagogicoService;
