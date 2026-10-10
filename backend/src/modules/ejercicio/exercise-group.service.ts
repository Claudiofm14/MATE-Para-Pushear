import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ExerciseGroup,
  ExerciseGroupMember,
  GroupExerciseRepository,
  Usuario,
} from '../../entities/index.entity';
import {
  addRepoCollaborator,
  ensureOrgMember,
  generateRepoFromTemplate,
  getRepo,
  mapGiteaError,
  removeRepoCollaborator,
} from '../../lib/gitea';
import { EjercicioService } from './ejercicio.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';

@Injectable()
export class ExerciseGroupService {
  private readonly logger = new Logger(ExerciseGroupService.name);
  constructor(
    @InjectRepository(ExerciseGroup) private groups: Repository<ExerciseGroup>,
    @InjectRepository(ExerciseGroupMember)
    private members: Repository<ExerciseGroupMember>,
    @InjectRepository(GroupExerciseRepository)
    private groupRepos: Repository<GroupExerciseRepository>,
    @InjectRepository(Usuario) private users: Repository<Usuario>,
    private dataSource: DataSource,
    private exercises: EjercicioService,
    private enrollments: AlumnoMateriaService,
  ) {}

  private normalizeName(name: string) {
    return name
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }
  private async context(exerciseId: number) {
    const exercise = await this.exercises.findOne(exerciseId);
    if (exercise.assignmentMode !== 'group')
      throw new BadRequestException('El ejercicio no es grupal');
    return exercise;
  }
  private assertOpen(exercise: any, group?: ExerciseGroup) {
    if (group?.modificationsLocked)
      throw new ForbiddenException(
        'Las modificaciones del grupo están bloqueadas',
      );
    if (
      exercise.groupsLockedAt &&
      new Date(exercise.groupsLockedAt) <= new Date()
    )
      throw new ForbiddenException('El plazo para modificar grupos finalizó');
  }
  private async assertEnrolled(exercise: any, studentId: number) {
    if (
      !(await this.enrollments.verificarAccesoAlumnoCursada(
        studentId,
        exercise.semana.cursada.id,
      ))
    )
      throw new ForbiddenException('No perteneces a esta cursada');
  }
  async list(exerciseId: number, studentId?: number) {
    const exercise = await this.context(exerciseId);
    if (studentId) await this.assertEnrolled(exercise, studentId);
    const groups = await this.groups.find({
      where: { exerciseId },
      relations: ['members', 'members.student'],
      order: { name: 'ASC' },
    });
    const repos = await this.groupRepos.find({ where: { exerciseId } });
    return groups.map((group) => ({
      ...group,
      repository: repos.find((repo) => repo.groupId === group.id) || null,
      memberCount: group.members.length,
      minGroupSize: exercise.minGroupSize,
      maxGroupSize: exercise.maxGroupSize,
      incomplete: group.members.length < exercise.minGroupSize,
    }));
  }
  async myGroup(exerciseId: number, studentId: number) {
    await this.context(exerciseId);
    const member = await this.members.findOne({
      where: { exerciseId, studentId },
      relations: ['group', 'group.members', 'group.members.student'],
    });
    if (!member) return null;
    const repository = await this.groupRepos.findOne({
      where: { exerciseId, groupId: member.groupId },
    });
    return { ...member.group, repository };
  }
  async create(
    exerciseId: number,
    student: Usuario,
    name: string,
    administrative = false,
  ) {
    const exercise = await this.context(exerciseId);
    await this.assertEnrolled(exercise, student.id);
    this.assertOpen(exercise);
    if (!administrative && !exercise.allowStudentGroupCreation)
      throw new ForbiddenException('Los estudiantes no pueden crear grupos');
    const clean = name?.trim();
    if (!clean || clean.length > 100)
      throw new BadRequestException('Nombre de grupo inválido');
    try {
      return await this.dataSource.transaction(async (manager) => {
        if (
          await manager.findOne(ExerciseGroupMember, {
            where: { exerciseId, studentId: student.id },
          })
        )
          throw new ConflictException('Ya perteneces a un grupo');
        const group = await manager.save(
          manager.create(ExerciseGroup, {
            exerciseId,
            name: clean,
            normalizedName: this.normalizeName(clean),
            createdByStudentId: student.id,
          }),
        );
        await manager.save(
          manager.create(ExerciseGroupMember, {
            exerciseId,
            groupId: group.id,
            studentId: student.id,
          }),
        );
        return group;
      });
    } catch (e: any) {
      if (e?.code === '23505')
        throw new ConflictException(
          'El nombre ya existe o el alumno ya tiene grupo',
        );
      throw e;
    }
  }
  async join(exerciseId: number, groupId: number, studentId: number) {
    const exercise = await this.context(exerciseId);
    await this.assertEnrolled(exercise, studentId);
    const group = await this.dataSource.transaction(async (manager) => {
      const group = await manager
        .createQueryBuilder(ExerciseGroup, 'g')
        .setLock('pessimistic_write')
        .where('g.id = :groupId AND g.exerciseId = :exerciseId', {
          groupId,
          exerciseId,
        })
        .getOne();
      if (!group) throw new NotFoundException('Grupo no encontrado');
      this.assertOpen(exercise, group);
      if (
        await manager.findOne(ExerciseGroupMember, {
          where: { exerciseId, studentId },
        })
      )
        throw new ConflictException('El alumno ya pertenece a un grupo');
      const count = await manager.count(ExerciseGroupMember, {
        where: { groupId },
      });
      if (count >= exercise.maxGroupSize)
        throw new ConflictException('El grupo está completo');
      await manager.save(
        manager.create(ExerciseGroupMember, { exerciseId, groupId, studentId }),
      );
      return group;
    });
    const repo = await this.groupRepos.findOneBy({ exerciseId, groupId });
    if (repo?.syncStatus === 'ready') {
      const student = await this.users.findOneByOrFail({ id: studentId });
      if (!student.githubUser) {
        await this.members.delete({ exerciseId, groupId, studentId });
        throw new BadRequestException(
          'El alumno no tiene usuario Gitea vinculado',
        );
      }
      try {
        await ensureOrgMember(repo.repositoryOwner, student.githubUser);
        await addRepoCollaborator(
          repo.repositoryOwner,
          repo.repositoryName,
          student.githubUser,
          'write',
        );
      } catch {
        await this.members.delete({ exerciseId, groupId, studentId });
        throw new BadRequestException(
          'No se pudo otorgar acceso en Gitea; no se modificó el grupo',
        );
      }
    }
    return group;
  }
  async leave(exerciseId: number, student: Usuario) {
    const exercise = await this.context(exerciseId);
    const member = await this.members.findOne({
      where: { exerciseId, studentId: student.id },
      relations: ['group'],
    });
    if (!member) throw new NotFoundException('No perteneces a un grupo');
    this.assertOpen(exercise, member.group);
    const repo = await this.groupRepos.findOne({
      where: { exerciseId, groupId: member.groupId },
    });
    if (repo?.syncStatus === 'ready') {
      if (!exercise.allowLeaveAfterRepositoryCreation)
        throw new ForbiddenException(
          'No se puede abandonar después de crear el repositorio',
        );
      if (!student.githubUser)
        throw new BadRequestException('No tienes usuario Gitea vinculado');
      try {
        await removeRepoCollaborator(
          repo.repositoryOwner,
          repo.repositoryName,
          student.githubUser,
        );
      } catch {
        throw new BadRequestException(
          'No se pudo retirar el acceso en Gitea; continúas en el grupo',
        );
      }
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(ExerciseGroupMember, member.id);
      if (
        !repo &&
        (await manager.count(ExerciseGroupMember, {
          where: { groupId: member.groupId },
        })) === 0
      )
        await manager.delete(ExerciseGroup, member.groupId);
    });
    return { message: 'Saliste del grupo' };
  }
  async setLocked(exerciseId: number, groupId: number, locked: boolean) {
    await this.context(exerciseId);
    const group = await this.groups.findOneBy({ id: groupId, exerciseId });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    group.modificationsLocked = locked;
    return this.groups.save(group);
  }
  async removeMember(exerciseId: number, groupId: number, studentId: number) {
    await this.context(exerciseId);
    const student = await this.users.findOneByOrFail({ id: studentId });
    const member = await this.members.findOneBy({
      exerciseId,
      groupId,
      studentId,
    });
    if (!member) throw new NotFoundException('Integrante no encontrado');
    const repo = await this.groupRepos.findOneBy({ exerciseId, groupId });
    if (repo?.syncStatus === 'ready' && student.githubUser) {
      try {
        await removeRepoCollaborator(
          repo.repositoryOwner,
          repo.repositoryName,
          student.githubUser,
        );
      } catch {
        throw new BadRequestException(
          'No se pudo retirar el colaborador en Gitea',
        );
      }
    }
    await this.members.delete(member.id);
    return { message: 'Integrante removido' };
  }
  async moveMember(
    exerciseId: number,
    studentId: number,
    targetGroupId: number,
  ) {
    const current = await this.members.findOneBy({ exerciseId, studentId });
    if (current?.groupId === targetGroupId) return current;
    if (current)
      await this.removeMember(exerciseId, current.groupId, studentId);
    try {
      return await this.join(exerciseId, targetGroupId, studentId);
    } catch (e) {
      if (current) await this.join(exerciseId, current.groupId, studentId);
      throw e;
    }
  }
  async ensureRepository(
    exerciseId: number,
    groupId: number,
    allowIncomplete = false,
  ) {
    const exercise = await this.context(exerciseId);
    const group = await this.groups.findOne({
      where: { id: groupId, exerciseId },
      relations: ['members', 'members.student'],
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (!allowIncomplete && group.members.length < exercise.minGroupSize)
      throw new BadRequestException(
        `Faltan ${exercise.minGroupSize - group.members.length} integrantes`,
      );
    if (allowIncomplete && group.members.length < exercise.minGroupSize)
      this.logger.warn(
        `Generación docente excepcional para ejercicio=${exerciseId} grupo=${groupId} integrantes=${group.members.length} mínimo=${exercise.minGroupSize}`,
      );
    const missing = group.members.filter((m) => !m.student.githubUser);
    if (missing.length)
      throw new BadRequestException(
        `Integrantes sin Gitea: ${missing.map((m) => `${m.student.nombre} ${m.student.apellido}`.trim()).join(', ')}`,
      );
    const org = exercise.semana.cursada.giteaOrgName;
    if (!org || !exercise.giteaTemplateOwner || !exercise.giteaTemplateRepo)
      throw new BadRequestException('Falta configurar Gitea o la plantilla');
    const name = `ejercicio-${exerciseId}-grupo-${groupId}`;
    let record = await this.groupRepos.findOne({
      where: { exerciseId, groupId },
    });
    if (record?.syncStatus === 'ready') return record;
    if (!record) {
      try {
        record = await this.groupRepos.save(
          this.groupRepos.create({
            exerciseId,
            groupId,
            repositoryOwner: org,
            repositoryName: name,
            syncStatus: 'pending',
          }),
        );
      } catch {
        record = await this.groupRepos.findOneByOrFail({ exerciseId, groupId });
      }
    }
    if (
      record.syncStatus === 'creating' &&
      Date.now() - record.updatedAt.getTime() < 60000
    )
      return record;
    record.syncStatus = 'creating';
    record.sanitizedError = null;
    await this.groupRepos.save(record);
    try {
      let repo = await getRepo(org, name);
      if (!repo)
        repo = await generateRepoFromTemplate({
          templateOwner: exercise.giteaTemplateOwner,
          templateRepo: exercise.giteaTemplateRepo,
          owner: org,
          name,
          description: `Repositorio grupal para ${exercise.titulo}`,
        });
      for (const member of group.members) {
        await ensureOrgMember(org, member.student.githubUser);
        await addRepoCollaborator(
          org,
          name,
          member.student.githubUser,
          'write',
        );
      }
      record.giteaRepositoryId = String(repo.id || '');
      record.repositoryUrl = repo.html_url || repo.link || '';
      record.syncStatus = 'ready';
      return await this.groupRepos.save(record);
    } catch (error) {
      record.syncStatus = 'error';
      record.sanitizedError = mapGiteaError(error).message;
      await this.groupRepos.save(record);
      this.logger.warn(
        `Error Gitea para ejercicio=${exerciseId} grupo=${groupId}: ${record.sanitizedError}`,
      );
      throw new BadRequestException(
        `No se pudo sincronizar el repositorio grupal con Gitea: ${record.sanitizedError}`,
      );
    }
  }
}
