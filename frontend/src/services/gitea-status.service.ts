import { apiService } from '../shared/services/api.service';

export type GiteaRepoStatus = {
  id: number;
  status: 'pending' | 'creating' | 'created' | 'failed';
  syncStatus: 'never_synced' | 'synced' | 'failed';
  repoExists: boolean;
  errorMessage?: string;
  repoName: string;
  repoUrl: string;
  cloneUrlHttp?: string;
  updatedAt: string;
  lastSyncedAt?: string;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCommitAuthor?: string;
  lastCommitAt?: string;
  alertLevel: 'none' | 'warning' | 'error';
  alertMessage?: string;
  exercise: {
    id: number;
    title?: string;
    dueDate?: string;
  };
  student: {
    id: number;
    name: string;
    giteaUser?: string;
    email?: string;
  };
};

class GiteaStatusService {
  async list(materiaId: number): Promise<GiteaRepoStatus[]> {
    return apiService.get<GiteaRepoStatus[]>(
      `/api/materia/${materiaId}/gitea-status`
    );
  }

  async sync(materiaId: number): Promise<GiteaRepoStatus[]> {
    return apiService.post<GiteaRepoStatus[]>(
      `/api/materia/${materiaId}/gitea-status/sync`,
      {},
      { timeout: 60000 }
    );
  }
}

export const giteaStatusService = new GiteaStatusService();
