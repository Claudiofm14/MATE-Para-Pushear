import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Ejercicio,
  TipoActividadEjercicio,
} from '../../entities/ejercicio.entity';
import { Semana } from '../../entities/semana.entity';
import { CreateEjercicioDto, UpdateEjercicioDto } from './dto/ejercicio.dto';
import { StudentExerciseRepository } from '../../entities/student-exercise-repository.entity';
import { Usuario } from '../../entities/usuario.entity';
import { TeacherExerciseRepository } from '../../entities/teacher-exercise-repository.entity';
import {
  addRepoCollaborator,
  ensureOrgMember,
  generateRepoFromTemplate,
  getRepo,
  mapGiteaError,
  normalizeGiteaSlug,
} from '../../lib/gitea';

@Injectable()
export class EjercicioService {
  constructor(
    @InjectRepository(Ejercicio)
    private ejercicioRepository: Repository<Ejercicio>,
    @InjectRepository(Semana)
    private semanaRepository: Repository<Semana>,
    @InjectRepository(StudentExerciseRepository)
    private studentRepoRepository: Repository<StudentExerciseRepository>,
    @InjectRepository(TeacherExerciseRepository)
    private teacherRepoRepository: Repository<TeacherExerciseRepository>,
  ) {}

  async findAll(): Promise<Ejercicio[]> {
    return await this.ejercicioRepository.find({
      relations: ['semana'],
    });
  }

  async findOne(id: number): Promise<Ejercicio> {
    const ejercicio = await this.ejercicioRepository.findOne({
      where: { id },
      relations: ['semana', 'semana.cursada', 'semana.cursada.materia'],
      withDeleted: true,
    });

    if (!ejercicio) {
      throw new NotFoundException(`Ejercicio con ID ${id} no encontrado`);
    }

    return ejercicio;
  }

  async findBySemana(semanaId: number): Promise<Ejercicio[]> {
    return await this.ejercicioRepository.find({
      where: { semana: { id: semanaId } },
      relations: ['semana'],
    });
  }

  async create(createEjercicioDto: CreateEjercicioDto): Promise<Ejercicio> {
    this.validateGroupConfiguration(createEjercicioDto);
    const semana = await this.semanaRepository.findOne({
      where: { id: createEjercicioDto.semanaId },
    });

    if (!semana) {
      throw new NotFoundException(
        `Semana con ID ${createEjercicioDto.semanaId} no encontrada`,
      );
    }

    const ejercicio = this.ejercicioRepository.create({
      titulo: createEjercicioDto.titulo,
      descripcion: createEjercicioDto.descripcion,
      url: createEjercicioDto.url,
      repositorioEjemplo: createEjercicioDto.repositorioEjemplo,
      readmeUrl: createEjercicioDto.readmeUrl,
      classroomUrl: createEjercicioDto.classroomUrl,
      tipoActividad: createEjercicioDto.tipoActividad || 'programacion',
      recursoTipo: createEjercicioDto.recursoTipo || null,
      recursoUrl: createEjercicioDto.recursoUrl || null,
      recursoTitulo: createEjercicioDto.recursoTitulo || null,
      giteaTemplateOwner: createEjercicioDto.giteaTemplateOwner || null,
      giteaTemplateRepo: createEjercicioDto.giteaTemplateRepo || null,
      giteaTemplateRepoId: createEjercicioDto.giteaTemplateRepoId || null,
      giteaTemplateCloneUrl: createEjercicioDto.giteaTemplateCloneUrl || null,
      giteaAutoCreateRepo: createEjercicioDto.giteaAutoCreateRepo ?? false,
      assignmentMode: createEjercicioDto.assignmentMode || 'individual',
      minGroupSize:
        createEjercicioDto.assignmentMode === 'group'
          ? createEjercicioDto.minGroupSize
          : null,
      maxGroupSize:
        createEjercicioDto.assignmentMode === 'group'
          ? createEjercicioDto.maxGroupSize
          : null,
      groupsLockedAt: createEjercicioDto.groupsLockedAt
        ? new Date(createEjercicioDto.groupsLockedAt)
        : null,
      allowStudentGroupCreation:
        createEjercicioDto.allowStudentGroupCreation ?? true,
      allowLeaveAfterRepositoryCreation:
        createEjercicioDto.allowLeaveAfterRepositoryCreation ?? false,
      fechaEntrega: createEjercicioDto.fechaEntrega
        ? this.normalizeDateOnly(createEjercicioDto.fechaEntrega)
        : undefined,
      semana,
    });
    this.normalizeExerciseByType(ejercicio);

    return await this.ejercicioRepository.save(ejercicio);
  }

  async update(
    id: number,
    updateEjercicioDto: UpdateEjercicioDto,
  ): Promise<Ejercicio> {
    const ejercicio = await this.findOne(id);
    this.validateGroupConfiguration({
      assignmentMode:
        updateEjercicioDto.assignmentMode ?? ejercicio.assignmentMode,
      minGroupSize: updateEjercicioDto.minGroupSize ?? ejercicio.minGroupSize,
      maxGroupSize: updateEjercicioDto.maxGroupSize ?? ejercicio.maxGroupSize,
    });

    // Actualizar semana si se proporciona
    if (updateEjercicioDto.semanaId) {
      const semana = await this.semanaRepository.findOne({
        where: { id: updateEjercicioDto.semanaId },
      });

      if (!semana) {
        throw new NotFoundException(
          `Semana con ID ${updateEjercicioDto.semanaId} no encontrada`,
        );
      }

      ejercicio.semana = semana;
    }

    // Actualizar campos básicos si están presentes
    if (updateEjercicioDto.titulo !== undefined) {
      ejercicio.titulo = updateEjercicioDto.titulo;
    }

    if (updateEjercicioDto.descripcion !== undefined) {
      ejercicio.descripcion = updateEjercicioDto.descripcion;
    }

    // Actualizar campos opcionales (permitir null para limpiarlos)
    if (updateEjercicioDto.url !== undefined) {
      ejercicio.url = updateEjercicioDto.url || null;
    }

    if (updateEjercicioDto.repositorioEjemplo !== undefined) {
      ejercicio.repositorioEjemplo =
        updateEjercicioDto.repositorioEjemplo || null;
    }

    if (updateEjercicioDto.readmeUrl !== undefined) {
      ejercicio.readmeUrl = updateEjercicioDto.readmeUrl || null;
    }

    if (updateEjercicioDto.classroomUrl !== undefined) {
      ejercicio.classroomUrl = updateEjercicioDto.classroomUrl || null;
    }

    if (updateEjercicioDto.tipoActividad !== undefined) {
      ejercicio.tipoActividad = updateEjercicioDto.tipoActividad;
    }

    if (updateEjercicioDto.recursoTipo !== undefined) {
      ejercicio.recursoTipo = updateEjercicioDto.recursoTipo || null;
    }

    if (updateEjercicioDto.recursoUrl !== undefined) {
      ejercicio.recursoUrl = updateEjercicioDto.recursoUrl || null;
    }

    if (updateEjercicioDto.recursoTitulo !== undefined) {
      ejercicio.recursoTitulo = updateEjercicioDto.recursoTitulo || null;
    }

    if (updateEjercicioDto.fechaEntrega !== undefined) {
      ejercicio.fechaEntrega = updateEjercicioDto.fechaEntrega
        ? this.normalizeDateOnly(updateEjercicioDto.fechaEntrega)
        : null;
    }

    if (updateEjercicioDto.giteaTemplateOwner !== undefined) {
      ejercicio.giteaTemplateOwner =
        updateEjercicioDto.giteaTemplateOwner || null;
    }

    if (updateEjercicioDto.giteaTemplateRepo !== undefined) {
      ejercicio.giteaTemplateRepo =
        updateEjercicioDto.giteaTemplateRepo || null;
    }

    if (updateEjercicioDto.giteaTemplateRepoId !== undefined) {
      ejercicio.giteaTemplateRepoId =
        updateEjercicioDto.giteaTemplateRepoId || null;
    }

    if (updateEjercicioDto.giteaTemplateCloneUrl !== undefined) {
      ejercicio.giteaTemplateCloneUrl =
        updateEjercicioDto.giteaTemplateCloneUrl || null;
    }

    if (updateEjercicioDto.giteaAutoCreateRepo !== undefined) {
      ejercicio.giteaAutoCreateRepo = updateEjercicioDto.giteaAutoCreateRepo;
    }
    if (updateEjercicioDto.assignmentMode !== undefined)
      ejercicio.assignmentMode = updateEjercicioDto.assignmentMode;
    if (updateEjercicioDto.minGroupSize !== undefined)
      ejercicio.minGroupSize = updateEjercicioDto.minGroupSize;
    if (updateEjercicioDto.maxGroupSize !== undefined)
      ejercicio.maxGroupSize = updateEjercicioDto.maxGroupSize;
    if (updateEjercicioDto.groupsLockedAt !== undefined)
      ejercicio.groupsLockedAt = updateEjercicioDto.groupsLockedAt
        ? new Date(updateEjercicioDto.groupsLockedAt)
        : null;
    if (updateEjercicioDto.allowStudentGroupCreation !== undefined)
      ejercicio.allowStudentGroupCreation =
        updateEjercicioDto.allowStudentGroupCreation;
    if (updateEjercicioDto.allowLeaveAfterRepositoryCreation !== undefined)
      ejercicio.allowLeaveAfterRepositoryCreation =
        updateEjercicioDto.allowLeaveAfterRepositoryCreation;

    this.normalizeExerciseByType(ejercicio);

    return await this.ejercicioRepository.save(ejercicio);
  }

  private validateGroupConfiguration(input: Partial<CreateEjercicioDto>) {
    if ((input.assignmentMode || 'individual') !== 'group') return;
    if (!input.minGroupSize || !input.maxGroupSize)
      throw new BadRequestException(
        'Los tamaños mínimo y máximo son obligatorios',
      );
    if (input.maxGroupSize < input.minGroupSize)
      throw new BadRequestException(
        'El máximo debe ser mayor o igual al mínimo',
      );
  }

  async remove(id: number): Promise<void> {
    const ejercicio = await this.findOne(id);
    await this.ejercicioRepository.softRemove(ejercicio);
  }

  async restore(id: number): Promise<Ejercicio> {
    const ejercicio = await this.findOne(id);

    if (!ejercicio.deletedAt) {
      throw new ConflictException(`Ejercicio con ID ${id} no está eliminado`);
    }

    await this.ejercicioRepository.restore(id);
    return this.findOne(id);
  }

  /**
   * Lectura del repositorio ya creado del alumno. Solo consulta la base:
   * no llama a Gitea ni escribe nada, para que abrir una semana no dispare
   * trabajo pesado por cada ejercicio (ver ensureStudentRepo).
   */
  async findStudentRepo(ejercicioId: number, studentId: number) {
    return await this.studentRepoRepository.findOne({
      where: { exerciseId: ejercicioId, studentId },
    });
  }

  async ensureStudentRepo(ejercicioId: number, student: Usuario) {
    const ejercicio = await this.findOne(ejercicioId);
    const existing = await this.studentRepoRepository.findOne({
      where: { exerciseId: ejercicioId, studentId: student.id },
    });

    if (
      !ejercicio.giteaAutoCreateRepo ||
      !ejercicio.giteaTemplateOwner ||
      !ejercicio.giteaTemplateRepo
    ) {
      throw new BadRequestException(
        'El ejercicio no tiene plantilla de Gitea configurada',
      );
    }

    const orgName = ejercicio.semana.cursada.giteaOrgName;
    if (!ejercicio.semana.cursada.giteaIntegrationEnabled || !orgName) {
      throw new BadRequestException(
        'La cursada no tiene organizacion de Gitea vinculada',
      );
    }

    const giteaUsername = student.githubUser;
    if (!giteaUsername) {
      throw new BadRequestException(
        'Tu usuario no tiene cuenta de Gitea asociada',
      );
    }

    if (existing?.status === 'created') {
      try {
        await ensureOrgMember(existing.giteaOwnerOrg || orgName, giteaUsername);
        if (existing.giteaRepoName) {
          await addRepoCollaborator(
            existing.giteaOwnerOrg || orgName,
            existing.giteaRepoName,
            giteaUsername,
            'write',
          );
        }
        existing.errorMessage = null;
        return await this.studentRepoRepository.save(existing);
      } catch (error) {
        const mapped = mapGiteaError(error);
        existing.status = 'failed';
        existing.errorMessage = mapped.message;
        await this.studentRepoRepository.save(existing);
        throw new BadRequestException(mapped.message);
      }
    }

    const repoName = normalizeGiteaSlug(
      `${ejercicio.titulo}-${giteaUsername}`,
      `ejercicio-${ejercicio.id}-${student.id}`,
    ).slice(0, 100);
    const fallbackRepoName = normalizeGiteaSlug(
      `${repoName}-${student.id}`,
      `ejercicio-${ejercicio.id}-${student.id}`,
    ).slice(0, 100);

    let record =
      existing ||
      this.studentRepoRepository.create({
        exerciseId: ejercicioId,
        studentId: student.id,
        giteaOwnerOrg: orgName,
        giteaRepoName: repoName,
        giteaRepoFullName: `${orgName}/${repoName}`,
        giteaRepoUrl: '',
        status: 'creating',
      });

    record.status = 'creating';
    record.errorMessage = null;
    record = await this.studentRepoRepository.save(record);

    try {
      await ensureOrgMember(orgName, giteaUsername);

      const repo = await this.createOrGetGeneratedRepo({
        ejercicio,
        orgName,
        repoName,
        fallbackRepoName,
        giteaUsername,
        student,
      });

      await addRepoCollaborator(orgName, repo.name, giteaUsername, 'write');

      record.giteaRepoName = repo.name;
      record.giteaRepoFullName = repo.full_name || `${orgName}/${repo.name}`;
      record.giteaRepoUrl = repo.html_url || repo.link || '';
      record.giteaCloneUrlHttp = repo.clone_url || '';
      record.giteaCloneUrlSsh = repo.ssh_url || '';
      record.status = 'created';
      record.errorMessage = null;

      return await this.studentRepoRepository.save(record);
    } catch (error) {
      const mapped = mapGiteaError(error);
      record.status = 'failed';
      record.errorMessage = mapped.message;
      await this.studentRepoRepository.save(record);
      throw new BadRequestException(mapped.message);
    }
  }

  async findTeacherRepo(ejercicioId: number, teacherId: number) {
    await this.findOne(ejercicioId);
    return this.teacherRepoRepository.findOne({
      where: { exerciseId: ejercicioId, teacherId },
    });
  }

  async ensureTeacherRepo(ejercicioId: number, teacher: Usuario) {
    const ejercicio = await this.findOne(ejercicioId);
    const existing = await this.teacherRepoRepository.findOne({
      where: { exerciseId: ejercicioId, teacherId: teacher.id },
    });

    if (
      !ejercicio.giteaAutoCreateRepo ||
      !ejercicio.giteaTemplateOwner ||
      !ejercicio.giteaTemplateRepo
    ) {
      throw new BadRequestException(
        'El ejercicio no tiene plantilla de Gitea configurada',
      );
    }

    const orgName = ejercicio.semana.cursada.giteaOrgName;
    if (!ejercicio.semana.cursada.giteaIntegrationEnabled || !orgName) {
      throw new BadRequestException(
        'La cursada no tiene organizacion de Gitea vinculada',
      );
    }

    const giteaUsername = teacher.githubUser;
    if (!giteaUsername) {
      throw new BadRequestException(
        'Tu usuario no tiene cuenta de Gitea asociada',
      );
    }

    if (existing?.status === 'created') {
      try {
        await ensureOrgMember(existing.giteaOwnerOrg || orgName, giteaUsername);
        await addRepoCollaborator(
          existing.giteaOwnerOrg || orgName,
          existing.giteaRepoName,
          giteaUsername,
          'write',
        );
        existing.errorMessage = null;
        return this.teacherRepoRepository.save(existing);
      } catch (error) {
        const mapped = mapGiteaError(error);
        existing.status = 'failed';
        existing.errorMessage = mapped.message;
        await this.teacherRepoRepository.save(existing);
        throw new BadRequestException(mapped.message);
      }
    }

    const repoName = normalizeGiteaSlug(
      `${ejercicio.titulo}-docente-${giteaUsername}`,
      `ejercicio-${ejercicio.id}-docente-${teacher.id}`,
    ).slice(0, 100);
    const fallbackRepoName = normalizeGiteaSlug(
      `${repoName}-${teacher.id}`,
      `ejercicio-${ejercicio.id}-docente-${teacher.id}`,
    ).slice(0, 100);

    let record =
      existing ||
      this.teacherRepoRepository.create({
        exerciseId: ejercicioId,
        teacherId: teacher.id,
        giteaOwnerOrg: orgName,
        giteaRepoName: repoName,
        giteaRepoFullName: `${orgName}/${repoName}`,
        giteaRepoUrl: '',
        status: 'creating',
      });

    record.status = 'creating';
    record.errorMessage = null;
    record = await this.teacherRepoRepository.save(record);

    try {
      await ensureOrgMember(orgName, giteaUsername);
      let repo = await getRepo(orgName, repoName);
      if (!repo) {
        try {
          repo = await generateRepoFromTemplate({
            templateOwner: ejercicio.giteaTemplateOwner,
            templateRepo: ejercicio.giteaTemplateRepo,
            owner: orgName,
            name: repoName,
            description: `Resolucion docente de ${ejercicio.titulo}`,
          });
        } catch (error) {
          repo = await getRepo(orgName, fallbackRepoName);
          if (!repo) {
            repo = await generateRepoFromTemplate({
              templateOwner: ejercicio.giteaTemplateOwner,
              templateRepo: ejercicio.giteaTemplateRepo,
              owner: orgName,
              name: fallbackRepoName,
              description: `Resolucion docente de ${ejercicio.titulo}`,
            });
          }
        }
      }

      await addRepoCollaborator(orgName, repo.name, giteaUsername, 'write');
      record.giteaRepoName = repo.name;
      record.giteaRepoFullName = repo.full_name || `${orgName}/${repo.name}`;
      record.giteaRepoUrl = repo.html_url || repo.link || '';
      record.giteaCloneUrlHttp = repo.clone_url || '';
      record.giteaCloneUrlSsh = repo.ssh_url || '';
      record.status = 'created';
      record.errorMessage = null;
      return this.teacherRepoRepository.save(record);
    } catch (error) {
      const mapped = mapGiteaError(error);
      record.status = 'failed';
      record.errorMessage = mapped.message;
      await this.teacherRepoRepository.save(record);
      throw new BadRequestException(mapped.message);
    }
  }

  private async createOrGetGeneratedRepo(input: {
    ejercicio: Ejercicio;
    orgName: string;
    repoName: string;
    fallbackRepoName: string;
    giteaUsername: string;
    student: Usuario;
  }) {
    const existing = await getRepo(input.orgName, input.repoName);
    if (existing) return existing;

    try {
      return await generateRepoFromTemplate({
        templateOwner: input.ejercicio.giteaTemplateOwner,
        templateRepo: input.ejercicio.giteaTemplateRepo,
        owner: input.orgName,
        name: input.repoName,
        description:
          `Entrega de ${input.student.nombre} ${input.student.apellido} para ${input.ejercicio.titulo}`.trim(),
      });
    } catch (error) {
      const fallbackExisting = await getRepo(
        input.orgName,
        input.fallbackRepoName,
      );
      if (fallbackExisting) return fallbackExisting;

      return await generateRepoFromTemplate({
        templateOwner: input.ejercicio.giteaTemplateOwner,
        templateRepo: input.ejercicio.giteaTemplateRepo,
        owner: input.orgName,
        name: input.fallbackRepoName,
        description:
          `Entrega de ${input.student.nombre} ${input.student.apellido} para ${input.ejercicio.titulo}`.trim(),
      });
    }
  }

  async findStudentReposByMateria(input: {
    materiaId: number;
    cursadaId: number;
    studentId: number;
  }) {
    const records = await this.studentRepoRepository
      .createQueryBuilder('repo')
      .leftJoinAndSelect('repo.exercise', 'exercise')
      .leftJoinAndSelect('exercise.semana', 'semana')
      .leftJoinAndSelect('semana.cursada', 'cursada')
      .where('repo.studentId = :studentId', { studentId: input.studentId })
      .andWhere('cursada.id = :cursadaId', { cursadaId: input.cursadaId })
      .andWhere('cursada.materiaId = :materiaId', {
        materiaId: input.materiaId,
      })
      .orderBy('semana.numeroSemana', 'ASC')
      .addOrderBy('exercise.fechaEntrega', 'ASC')
      .addOrderBy('exercise.id', 'ASC')
      .getMany();

    return records.map((record) => ({
      id: record.id,
      status: record.status,
      syncStatus: record.syncStatus,
      repoExists: record.repoExists,
      errorMessage: record.errorMessage,
      repoName: record.giteaRepoName,
      repoFullName: record.giteaRepoFullName,
      repoUrl: record.giteaRepoUrl,
      cloneUrlHttp: record.giteaCloneUrlHttp,
      cloneUrlSsh: record.giteaCloneUrlSsh,
      updatedAt: record.updatedAt,
      lastSyncedAt: record.lastSyncedAt,
      lastCommitSha: record.lastCommitSha,
      lastCommitMessage: record.lastCommitMessage,
      lastCommitAuthor: record.lastCommitAuthor,
      lastCommitAt: record.lastCommitAt,
      exercise: {
        id: record.exercise?.id,
        title: record.exercise?.titulo,
        dueDate: record.exercise?.fechaEntrega,
      },
      week: {
        id: record.exercise?.semana?.id,
        title: record.exercise?.semana?.titulo,
        number: record.exercise?.semana?.numeroSemana,
      },
      cursada: {
        id: record.exercise?.semana?.cursada?.id,
        title: record.exercise?.semana?.cursada?.titulo,
        giteaOrgName: record.exercise?.semana?.cursada?.giteaOrgName,
        giteaOrgUrl: record.exercise?.semana?.cursada?.giteaOrgUrl,
      },
    }));
  }

  private normalizeDateOnly(value: string) {
    return value.split('T')[0];
  }

  private normalizeExerciseByType(ejercicio: Ejercicio) {
    const tipo: TipoActividadEjercicio =
      ejercicio.tipoActividad || 'programacion';
    ejercicio.tipoActividad = tipo;

    if (tipo !== 'programacion') {
      ejercicio.repositorioEjemplo = null;
      ejercicio.classroomUrl = null;
      ejercicio.giteaTemplateOwner = null;
      ejercicio.giteaTemplateRepo = null;
      ejercicio.giteaTemplateRepoId = null;
      ejercicio.giteaTemplateCloneUrl = null;
      ejercicio.giteaAutoCreateRepo = false;
    }

    if (tipo === 'programacion') {
      ejercicio.recursoTipo = null;
      ejercicio.recursoUrl = null;
      ejercicio.recursoTitulo = null;
    }

    if (tipo === 'instrucciones') {
      ejercicio.recursoTipo = null;
      ejercicio.recursoUrl = null;
      ejercicio.recursoTitulo = null;
    }
  }
}
