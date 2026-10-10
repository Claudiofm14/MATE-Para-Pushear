import { apiService } from '../shared/services/api.service';

export type TrashItem = {
  id: number;
  title: string;
  type: 'cursada' | 'semana' | 'video' | 'ejercicio';
  deletedAt: string | null;
  detail?: string;
};

class TrashService {
  async list(materiaId: number): Promise<TrashItem[]> {
    return apiService.get<TrashItem[]>(`/api/materia/${materiaId}/papelera`);
  }

  async restore(materiaId: number, type: TrashItem['type'], id: number) {
    return apiService.patch(
      `/api/materia/${materiaId}/papelera/${type}/${id}/restore`
    );
  }
}

export const trashService = new TrashService();
