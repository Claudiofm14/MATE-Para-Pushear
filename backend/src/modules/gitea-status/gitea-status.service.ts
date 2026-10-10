import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentExerciseRepository } from '../../entities/index.entity';
import { getRepo, listRepoCommits } from '../../lib/gitea';

@Injectable()
export class GiteaStatusService {
  constructor(
    @InjectRepository(StudentExerciseRepository)
    private readonly repository: Repository<StudentExerciseRepository>,
  ) {}

  async listByMateria(materiaId: number) {
    const records = await this.repository
      .createQueryBuilder('repo')
      .leftJoinAndSelect('repo.student', 'student')
      .leftJoinAndSelect('repo.exercise', 'exercise')
      .leftJoinAndSelect('exercise.semana', 'semana')
      .leftJoinAndSelect('semana.cursada', 'cursada')
      .where('cursada.materiaId = :materiaId', { materiaId })
      .orderBy('repo.updatedAt', 'DESC')
      .getMany();

    return records.map((record) => this.toDto(record));
  }

  async syncByMateria(materiaId: number) {
    const records = await this.repository
      .createQueryBuilder('repo')
      .leftJoinAndSelect('repo.student', 'student')
      .leftJoinAndSelect('repo.exercise', 'exercise')
      .leftJoinAndSelect('exercise.semana', 'semana')
      .leftJoinAndSelect('semana.cursada', 'cursada')
      .where('cursada.materiaId = :materiaId', { materiaId })
      .getMany();

    // Limitamos las consultas simultaneas para reducir la espera sin enviar
    // todas las solicitudes de una materia a Gitea al mismo tiempo.
    let nextIndex = 0;
    const syncWorker = async () => {
      while (nextIndex < records.length) {
        const record = records[nextIndex++];
        await this.syncRecord(record);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(5, records.length) }, syncWorker),
    );

    return this.listByMateria(materiaId);
  }

  private async syncRecord(record: StudentExerciseRepository) {
    const now = new Date();

    try {
      const repo = await getRepo(record.giteaOwnerOrg, record.giteaRepoName);
      if (!repo) {
        await this.repository.save({
          ...record,
          repoExists: false,
          syncStatus: 'failed',
          status: 'failed',
          lastSyncedAt: now,
          errorMessage: 'Repositorio no encontrado en Gitea',
        });
        return;
      }

      const commits = await listRepoCommits(
        record.giteaOwnerOrg,
        record.giteaRepoName,
        1,
      );
      const latest = commits[0];
      const commitAuthor =
        latest?.commit?.author?.name ||
        latest?.author?.full_name ||
        latest?.author?.username ||
        latest?.commit?.author?.email ||
        null;
      const commitDate =
        latest?.commit?.author?.date ||
        latest?.commit?.committer?.date ||
        latest?.created ||
        null;

      await this.repository.save({
        ...record,
        repoExists: true,
        syncStatus: 'synced',
        status: 'created',
        errorMessage: null,
        giteaRepoUrl: repo.html_url || record.giteaRepoUrl,
        giteaCloneUrlHttp: repo.clone_url || record.giteaCloneUrlHttp,
        giteaCloneUrlSsh: repo.ssh_url || record.giteaCloneUrlSsh,
        lastSyncedAt: now,
        lastCommitSha: latest?.sha || null,
        lastCommitMessage: latest?.commit?.message || null,
        lastCommitAuthor: commitAuthor,
        lastCommitAt: commitDate ? new Date(commitDate) : null,
      });
    } catch (error: any) {
      await this.repository.save({
        ...record,
        syncStatus: 'failed',
        lastSyncedAt: now,
        errorMessage:
          error?.message || 'No se pudo sincronizar el repositorio con Gitea',
      });
    }
  }

  private toDto(record: StudentExerciseRepository) {
    const alert = this.getAlert(record);

    return {
      id: record.id,
      status: record.status,
      syncStatus: record.syncStatus,
      repoExists: record.repoExists,
      errorMessage: record.errorMessage,
      repoName: record.giteaRepoFullName,
      repoUrl: record.giteaRepoUrl,
      cloneUrlHttp: record.giteaCloneUrlHttp,
      updatedAt: record.updatedAt,
      lastSyncedAt: record.lastSyncedAt,
      lastCommitSha: record.lastCommitSha,
      lastCommitMessage: record.lastCommitMessage,
      lastCommitAuthor: record.lastCommitAuthor,
      lastCommitAt: record.lastCommitAt,
      alertLevel: alert.level,
      alertMessage: alert.message,
      exercise: {
        id: record.exerciseId,
        title: record.exercise?.titulo,
        dueDate: record.exercise?.fechaEntrega,
      },
      student: {
        id: record.studentId,
        name: `${record.student?.nombre || ''} ${record.student?.apellido || ''}`.trim(),
        giteaUser: record.student?.githubUser,
        email: record.student?.email,
      },
    };
  }

  private getAlert(record: StudentExerciseRepository): {
    level: 'none' | 'warning' | 'error';
    message?: string;
  } {
    if (record.status === 'failed' || record.syncStatus === 'failed') {
      return {
        level: 'error',
        message: record.errorMessage || 'El repositorio tiene errores',
      };
    }

    if (!record.repoExists) {
      return { level: 'error', message: 'Repositorio no encontrado en Gitea' };
    }

    if (!record.lastSyncedAt) {
      return { level: 'warning', message: 'Nunca sincronizado' };
    }

    if (!record.lastCommitAt) {
      return { level: 'warning', message: 'Sin commits registrados' };
    }

    return { level: 'none' };
  }
}
