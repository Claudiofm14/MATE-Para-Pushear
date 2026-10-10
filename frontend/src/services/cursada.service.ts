import { apiClient } from './api.client';

export interface Cursada {
  id: number;
  titulo: string;
  descripcion?: string;
  activa: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  giteaIntegrationEnabled?: boolean;
  giteaOrgName?: string | null;
  giteaOrgId?: string | null;
  giteaOrgUrl?: string | null;
  materiaId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateCursadaDto {
  titulo: string;
  descripcion?: string;
  activa?: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  giteaIntegrationEnabled?: boolean;
  giteaOrgName?: string;
  giteaOrgId?: string;
  giteaOrgUrl?: string;
  materiaId: number;
}

export interface UpdateCursadaDto {
  titulo?: string;
  descripcion?: string;
  activa?: boolean;
  /** null limpia la fecha guardada; undefined la deja como estaba. */
  fechaInicio?: string | null;
  fechaFin?: string | null;
  giteaIntegrationEnabled?: boolean;
  giteaOrgName?: string;
  giteaOrgId?: string;
  giteaOrgUrl?: string;
  materiaId?: number;
}

export interface GiteaOrganization {
  id?: number;
  username: string;
  full_name?: string;
  description?: string;
  html_url?: string;
  website?: string;
}

export const cursadaService = {
  /**
   * Obtener todas las cursadas
   */
  async getAll(): Promise<Cursada[]> {
    const response = await apiClient.get<Cursada[]>('/cursada');
    return response.data;
  },

  /**
   * Obtener una cursada por ID
   */
  async getById(id: number): Promise<Cursada> {
    const response = await apiClient.get<Cursada>(`/cursada/${id}`);
    return response.data;
  },

  /**
   * Obtener cursadas por materia
   */
  async getByMateria(materiaId: number): Promise<Cursada[]> {
    const response = await apiClient.get<Cursada[]>(
      `/cursada/materia/${materiaId}`
    );
    return response.data;
  },

  /**
   * Crear una nueva cursada
   */
  async create(data: CreateCursadaDto): Promise<Cursada> {
    const response = await apiClient.post<Cursada>('/cursada', data);
    return response.data;
  },

  /**
   * Actualizar una cursada existente
   */
  async update(id: number, data: UpdateCursadaDto): Promise<Cursada> {
    const response = await apiClient.put<Cursada>(`/cursada/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar una cursada (soft delete)
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/cursada/${id}`);
  },

  /**
   * Finalizar una cursada: la pausa y fija la fecha de fin actual
   */
  async finalizar(id: number): Promise<Cursada> {
    const response = await apiClient.patch<Cursada>(`/cursada/${id}/finalizar`);
    return response.data;
  },

  /**
   * Restaurar una cursada eliminada
   */
  async restore(id: number): Promise<Cursada> {
    const response = await apiClient.patch<Cursada>(`/cursada/${id}/restore`);
    return response.data;
  },

  async duplicate(id: number): Promise<Cursada> {
    const response = await apiClient.post<Cursada>(`/cursada/${id}/duplicate`);
    return response.data;
  },

  async listGiteaOrgs(): Promise<GiteaOrganization[]> {
    const response =
      await apiClient.get<GiteaOrganization[]>('/api/gitea/orgs');
    return response.data;
  },

  async createGiteaOrg(data: {
    name: string;
    fullName?: string;
    description?: string;
  }): Promise<GiteaOrganization> {
    const response = await apiClient.post<GiteaOrganization>(
      '/api/gitea/orgs',
      data
    );
    return response.data;
  },
};

export default cursadaService;
