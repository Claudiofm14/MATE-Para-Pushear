import { apiClient } from './api.client';

export type CronogramaModalidad = 'presencial' | 'virtual';

export interface CronogramaFilaComision {
  id?: number;
  comisionId: number;
  modalidad: CronogramaModalidad;
  comision?: { id: number; nombre: string };
}

export interface CronogramaFila {
  id: number;
  cursadaId: number;
  numeroSemana: number;
  fecha: string;
  hora: string | null;
  actividades: string;
  temas: string;
  tareas: string;
  comisiones: CronogramaFilaComision[];
}

export type CronogramaFilaInput = Omit<CronogramaFila, 'id' | 'cursadaId'>;

export const cronogramaService = {
  async list(
    cursadaId: number,
    comisionId?: number
  ): Promise<CronogramaFila[]> {
    const response = await apiClient.get<CronogramaFila[]>(
      `/cronograma/cursada/${cursadaId}`,
      { params: comisionId ? { comisionId } : undefined }
    );
    return response.data;
  },
  async create(cursadaId: number, input: CronogramaFilaInput) {
    const response = await apiClient.post<CronogramaFila>(
      `/cronograma/cursada/${cursadaId}/filas`,
      input
    );
    return response.data;
  },
  async update(id: number, input: CronogramaFilaInput) {
    const response = await apiClient.put<CronogramaFila>(
      `/cronograma/filas/${id}`,
      input
    );
    return response.data;
  },
  async remove(id: number) {
    await apiClient.delete(`/cronograma/filas/${id}`);
  },
};
