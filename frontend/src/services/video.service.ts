import { apiClient } from './api.client';

export interface Video {
  id: number;
  titulo: string;
  subtitulo?: string;
  url: string;
  semanaId?: number;
  materiaId?: number;
  semana?: { id: number; cursadaId?: number };
  materia?: { id: number };
  orden?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateVideoDto {
  titulo: string;
  subtitulo?: string;
  url: string;
  semanaId?: number;
  materiaId?: number;
  orden?: number;
}

export interface UpdateVideoDto {
  titulo?: string;
  subtitulo?: string;
  url?: string;
  semanaId?: number;
  materiaId?: number;
  orden?: number;
}

export interface YoutubePlaylistVideos {
  playlistId: string;
  videos: Array<{
    playlistItemId: string;
    videoId: string;
    titulo: string;
    url: string;
    orden: number;
  }>;
}

export const videoService = {
  async getPlaylistVideos(
    id: number,
    signal?: AbortSignal
  ): Promise<YoutubePlaylistVideos> {
    const response = await apiClient.get<YoutubePlaylistVideos>(
      `/video/${id}/playlist`,
      { signal }
    );
    return response.data;
  },

  /**
   * Obtener todos los videos
   */
  async getAll(): Promise<Video[]> {
    const response = await apiClient.get<Video[]>('/video');
    return response.data;
  },

  /**
   * Obtener un video por ID
   */
  async getById(id: number): Promise<Video> {
    const response = await apiClient.get<Video>(`/video/${id}`);
    return response.data;
  },

  /**
   * Obtener videos por semana
   */
  async getBySemana(semanaId: number): Promise<Video[]> {
    const response = await apiClient.get<Video[]>(`/video/semana/${semanaId}`);
    return response.data;
  },

  /**
   * Obtener videos por materia
   */
  async getByMateria(materiaId: number): Promise<Video[]> {
    const response = await apiClient.get<Video[]>(
      `/video/materia/${materiaId}`
    );
    return response.data;
  },

  /**
   * Crear un nuevo video
   */
  async create(data: CreateVideoDto): Promise<Video> {
    const response = await apiClient.post<Video>('/video', data);
    return response.data;
  },

  /**
   * Actualizar un video existente
   */
  async update(id: number, data: UpdateVideoDto): Promise<Video> {
    const response = await apiClient.put<Video>(`/video/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un video (soft delete)
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/video/${id}`);
  },

  /**
   * Restaurar un video eliminado
   */
  async restore(id: number): Promise<Video> {
    const response = await apiClient.patch<Video>(`/video/${id}/restore`);
    return response.data;
  },
};

export default videoService;
