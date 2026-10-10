import { apiClient } from './api.client';

export type TipoActividadEjercicio =
  | 'programacion'
  | 'enlace'
  | 'archivo'
  | 'instrucciones';

export type TipoRecursoEjercicio =
  | 'planilla'
  | 'documento'
  | 'presentacion'
  | 'pdf'
  | 'video'
  | 'otro';
export type AssignmentMode = 'individual' | 'group';

export interface Ejercicio {
  id: number;
  titulo: string;
  descripcion: string;
  url?: string;
  repositorioEjemplo?: string;
  readmeUrl?: string;
  classroomUrl?: string;
  tipoActividad?: TipoActividadEjercicio;
  recursoTipo?: TipoRecursoEjercicio;
  recursoUrl?: string;
  recursoTitulo?: string;
  fechaEntrega?: string;
  giteaTemplateOwner?: string;
  giteaTemplateRepo?: string;
  giteaTemplateRepoId?: string;
  giteaTemplateCloneUrl?: string;
  giteaAutoCreateRepo?: boolean;
  assignmentMode?: AssignmentMode;
  minGroupSize?: number;
  maxGroupSize?: number;
  groupsLockedAt?: string;
  allowStudentGroupCreation?: boolean;
  allowLeaveAfterRepositoryCreation?: boolean;
  semanaId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateEjercicioDto {
  titulo: string;
  descripcion: string;
  url?: string;
  repositorioEjemplo?: string;
  readmeUrl?: string;
  classroomUrl?: string;
  tipoActividad?: TipoActividadEjercicio;
  recursoTipo?: TipoRecursoEjercicio;
  recursoUrl?: string;
  recursoTitulo?: string;
  fechaEntrega?: string;
  giteaTemplateOwner?: string;
  giteaTemplateRepo?: string;
  giteaTemplateRepoId?: string;
  giteaTemplateCloneUrl?: string;
  giteaAutoCreateRepo?: boolean;
  assignmentMode?: AssignmentMode;
  minGroupSize?: number;
  maxGroupSize?: number;
  groupsLockedAt?: string;
  allowStudentGroupCreation?: boolean;
  allowLeaveAfterRepositoryCreation?: boolean;
  semanaId: number;
}

export interface UpdateEjercicioDto {
  titulo?: string;
  descripcion?: string;
  url?: string;
  repositorioEjemplo?: string;
  readmeUrl?: string;
  classroomUrl?: string;
  tipoActividad?: TipoActividadEjercicio;
  recursoTipo?: TipoRecursoEjercicio;
  recursoUrl?: string;
  recursoTitulo?: string;
  fechaEntrega?: string;
  giteaTemplateOwner?: string;
  giteaTemplateRepo?: string;
  giteaTemplateRepoId?: string;
  giteaTemplateCloneUrl?: string;
  giteaAutoCreateRepo?: boolean;
  assignmentMode?: AssignmentMode;
  minGroupSize?: number;
  maxGroupSize?: number;
  groupsLockedAt?: string;
  allowStudentGroupCreation?: boolean;
  allowLeaveAfterRepositoryCreation?: boolean;
  semanaId?: number;
}

export interface ExerciseGroup {
  id: number;
  exerciseId: number;
  name: string;
  modificationsLocked: boolean;
  members: Array<{
    id: number;
    studentId: number;
    student: {
      id: number;
      nombre: string;
      apellido: string;
      email: string;
      githubUser?: string;
    };
  }>;
  memberCount?: number;
  minGroupSize?: number;
  maxGroupSize?: number;
  incomplete?: boolean;
  repository?: {
    id: number;
    repositoryUrl: string;
    syncStatus: 'pending' | 'creating' | 'ready' | 'error';
    sanitizedError?: string;
  } | null;
}

export interface GiteaTemplateRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url?: string;
  clone_url?: string;
  ssh_url?: string;
  private?: boolean;
}

export interface StudentExerciseRepository {
  id: number;
  exerciseId: number;
  studentId: number;
  giteaOwnerOrg: string;
  giteaRepoName: string;
  giteaRepoFullName: string;
  giteaRepoUrl: string;
  giteaCloneUrlHttp?: string;
  giteaCloneUrlSsh?: string;
  status: 'pending' | 'creating' | 'created' | 'failed';
  errorMessage?: string;
}

export interface TeacherExerciseRepository {
  id: number;
  exerciseId: number;
  teacherId: number;
  giteaOwnerOrg: string;
  giteaRepoName: string;
  giteaRepoFullName: string;
  giteaRepoUrl: string;
  giteaCloneUrlHttp?: string;
  giteaCloneUrlSsh?: string;
  status: 'pending' | 'creating' | 'created' | 'failed';
  errorMessage?: string;
}

export interface MyExerciseRepository {
  id: number;
  status: 'pending' | 'creating' | 'created' | 'failed';
  syncStatus: 'never_synced' | 'synced' | 'failed';
  repoExists: boolean;
  errorMessage?: string;
  repoName: string;
  repoFullName: string;
  repoUrl: string;
  cloneUrlHttp?: string;
  cloneUrlSsh?: string;
  updatedAt?: string;
  lastSyncedAt?: string;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCommitAuthor?: string;
  lastCommitAt?: string;
  exercise: {
    id: number;
    title?: string;
    dueDate?: string;
  };
  week: {
    id: number;
    title?: string;
    number?: number;
  };
  cursada: {
    id: number;
    title?: string;
    giteaOrgName?: string;
    giteaOrgUrl?: string;
  };
}

export const ejercicioService = {
  /**
   * Obtener todos los ejercicios
   */
  async getAll(): Promise<Ejercicio[]> {
    const response = await apiClient.get<Ejercicio[]>('/ejercicio');
    return response.data;
  },

  /**
   * Obtener un ejercicio por ID
   */
  async getById(id: number): Promise<Ejercicio> {
    const response = await apiClient.get<Ejercicio>(`/ejercicio/${id}`);
    return response.data;
  },

  /**
   * Obtener ejercicios por semana
   */
  async getBySemana(semanaId: number): Promise<Ejercicio[]> {
    const response = await apiClient.get<Ejercicio[]>(
      `/ejercicio/semana/${semanaId}`
    );
    return response.data;
  },

  /**
   * Crear un nuevo ejercicio
   */
  async create(data: CreateEjercicioDto): Promise<Ejercicio> {
    const response = await apiClient.post<Ejercicio>('/ejercicio', data);
    return response.data;
  },

  /**
   * Actualizar un ejercicio existente
   */
  async update(id: number, data: UpdateEjercicioDto): Promise<Ejercicio> {
    const response = await apiClient.put<Ejercicio>(`/ejercicio/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un ejercicio (soft delete)
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/ejercicio/${id}`);
  },

  /**
   * Restaurar un ejercicio eliminado
   */
  async restore(id: number): Promise<Ejercicio> {
    const response = await apiClient.patch<Ejercicio>(
      `/ejercicio/${id}/restore`
    );
    return response.data;
  },

  async getTemplatesByCursada(
    cursadaId: number,
    options: { refresh?: boolean; signal?: AbortSignal } = {}
  ): Promise<{
    organization: { name: string; url: string } | null;
    templates: GiteaTemplateRepo[];
    message?: string;
  }> {
    const response = await apiClient.get(
      `/api/gitea/cursadas/${cursadaId}/templates`,
      {
        params: options.refresh ? { refresh: 'true' } : undefined,
        signal: options.signal,
      }
    );
    return response.data;
  },

  // Lectura barata: no crea nada en Gitea. Usar esta al abrir la pantalla y
  // dejar ensureStudentRepo() para cuando el alumno pida crear el repo.
  async getStudentRepo(
    ejercicioId: number
  ): Promise<StudentExerciseRepository | null> {
    const response = await apiClient.get<StudentExerciseRepository | null>(
      `/ejercicio/${ejercicioId}/student-repo`
    );
    return response.data;
  },
  async ensureStudentRepo(
    ejercicioId: number
  ): Promise<StudentExerciseRepository> {
    const response = await apiClient.post<StudentExerciseRepository>(
      `/ejercicio/${ejercicioId}/student-repo`,
      {}
    );
    return response.data;
  },
  async getTeacherRepo(
    ejercicioId: number
  ): Promise<TeacherExerciseRepository | null> {
    const response = await apiClient.get<TeacherExerciseRepository | null>(
      `/ejercicio/${ejercicioId}/teacher-repo`
    );
    return response.data;
  },
  async ensureTeacherRepo(
    ejercicioId: number
  ): Promise<TeacherExerciseRepository> {
    const response = await apiClient.post<TeacherExerciseRepository>(
      `/ejercicio/${ejercicioId}/teacher-repo`,
      {}
    );
    return response.data;
  },
  async listGroups(id: number): Promise<ExerciseGroup[]> {
    return (await apiClient.get(`/ejercicio/${id}/groups`)).data;
  },
  async myGroup(id: number): Promise<ExerciseGroup | null> {
    return (await apiClient.get(`/ejercicio/${id}/groups/mine`)).data;
  },
  async createGroup(id: number, name: string) {
    return (await apiClient.post(`/ejercicio/${id}/groups`, { name })).data;
  },
  async joinGroup(id: number, groupId: number) {
    return (await apiClient.post(`/ejercicio/${id}/groups/${groupId}/join`))
      .data;
  },
  async leaveGroup(id: number) {
    return (await apiClient.delete(`/ejercicio/${id}/groups/mine`)).data;
  },
  async ensureGroupRepo(id: number, groupId: number) {
    return (
      await apiClient.post(`/ejercicio/${id}/groups/${groupId}/repository`)
    ).data;
  },
  async lockGroup(id: number, groupId: number, locked: boolean) {
    return (
      await apiClient.patch(`/ejercicio/${id}/groups/${groupId}/lock`, {
        locked,
      })
    ).data;
  },
  async adminGroupRepo(id: number, groupId: number) {
    return (
      await apiClient.post(
        `/ejercicio/${id}/groups/${groupId}/admin-repository`
      )
    ).data;
  },
  async adminCreateGroup(id: number, name: string, studentId: number) {
    return (
      await apiClient.post(`/ejercicio/${id}/groups/admin`, { name, studentId })
    ).data;
  },
  async adminAddMember(id: number, groupId: number, studentId: number) {
    return (
      await apiClient.post(
        `/ejercicio/${id}/groups/${groupId}/members/${studentId}`
      )
    ).data;
  },
  async adminRemoveMember(id: number, groupId: number, studentId: number) {
    return (
      await apiClient.delete(
        `/ejercicio/${id}/groups/${groupId}/members/${studentId}`
      )
    ).data;
  },
  async adminMoveMember(id: number, groupId: number, studentId: number) {
    return (
      await apiClient.post(
        `/ejercicio/${id}/groups/${groupId}/move/${studentId}`
      )
    ).data;
  },

  async getMyReposByMateria(
    materiaId: number
  ): Promise<MyExerciseRepository[]> {
    const response = await apiClient.get<MyExerciseRepository[]>(
      `/ejercicio/materia/${materiaId}/mis-repos`
    );
    return response.data;
  },
};

export default ejercicioService;
