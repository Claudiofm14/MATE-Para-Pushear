import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SemanaService } from './semana.service';
import { Semana } from '../../entities/semana.entity';
import { CreateSemanaDto, UpdateSemanaDto } from './dto/semana.dto';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
import { CursadaService } from '../cursada/cursada.service';
import { Request as ExpressRequest } from 'express';
import { ForbiddenException, UseGuards, Request } from '@nestjs/common';
import { MateriaLogService } from '../materia-log/materia-log.service';
import { MateriaLogAction } from '../../entities/materia-log.entity';

@ApiTags('Semana')
@Controller('semana')
export class SemanaController {
  constructor(
    private readonly semanaService: SemanaService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
    private readonly cursadaService: CursadaService,
    private readonly materiaLogService: MateriaLogService,
  ) {}

  private getActor(user: any) {
    return {
      usuarioId: user.id,
      actorNombre: `${user.nombre} ${user.apellido}`.trim(),
      actorEmail: user.email,
    };
  }

  @ApiOperation({ summary: 'Obtener todas las semanas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas las semanas',
    type: [Semana],
  })
  @Get()
  @Roles(USER_ROLES.ADMIN)
  async findAll(): Promise<Semana[]> {
    return this.semanaService.findAll();
  }

  @ApiOperation({ summary: 'Obtener una semana por ID' })
  @ApiParam({ name: 'id', description: 'ID de la semana', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Semana encontrada',
    type: Semana,
  })
  @ApiResponse({
    status: 404,
    description: 'Semana no encontrada',
  })
  @Get(':id/vista-alumno/:comisionId')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async findOneAsStudent(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('comisionId', ParseIntPipe) comisionId: number,
  ): Promise<Semana> {
    const semana = await this.semanaService.findOne(id);
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];
    const canPreview =
      userRoles.includes(USER_ROLES.ADMIN) ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        user.id,
        semana.cursada.materia.id,
      ));

    if (!canPreview) {
      throw new ForbiddenException(
        'No tienes permisos para previsualizar esta materia',
      );
    }

    const visibles = await this.semanaService.findVisiblesParaAlumno(
      semana.cursada.id,
      comisionId,
    );
    if (!visibles.some((visible) => visible.id === semana.id)) {
      throw new ForbiddenException(
        'Esta semana no es visible para la comision seleccionada',
      );
    }

    semana.comisiones = semana.comisiones.filter(
      (comision) => comision.id === comisionId,
    );
    if (semana.fechasClasePorComision) {
      const fecha = semana.fechasClasePorComision[String(comisionId)];
      semana.fechasClasePorComision = fecha
        ? { [String(comisionId)]: fecha }
        : {};
    }
    return semana;
  }

  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Semana> {
    const semana = await this.semanaService.findOne(id);
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAccesoProfesor =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          semana.cursada.materia.id,
        );

      if (!tieneAccesoProfesor) {
        const comisionIds = semana.comisiones?.map((c) => c.id) || [];
        const accesoAlumno = await Promise.all(
          comisionIds.map(async (comisionId) => {
            const tieneAcceso =
              await this.alumnoMateriaService.verificarAccesoAlumnoCursada(
                user.id,
                semana.cursada.id,
                comisionId,
              );

            if (!tieneAcceso) return false;

            const visibles = await this.semanaService.findVisiblesParaAlumno(
              semana.cursada.id,
              comisionId,
            );
            return visibles.some((visible) => visible.id === semana.id);
          }),
        );

        if (!accesoAlumno.some(Boolean)) {
          throw new ForbiddenException('No tienes acceso a esta semana');
        }
      }
    }

    return semana;
  }

  @ApiOperation({ summary: 'Obtener semanas por cursada' })
  @ApiParam({
    name: 'cursadaId',
    description: 'ID de la cursada',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de semanas de la cursada',
    type: [Semana],
  })
  @Get('cursada/:cursadaId')
  async findByCursada(
    @Request() req,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
  ): Promise<Semana[]> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const cursada = await this.cursadaService.findAccessReference(cursadaId);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          cursada.materiaId,
        );

      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta cursada');
      }
    }

    return this.semanaService.findByCursada(cursadaId);
  }

  @ApiOperation({ summary: 'Obtener semanas por comisión' })
  @ApiParam({
    name: 'comisionId',
    description: 'ID de la comisión',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de semanas de la comisión',
    type: [Semana],
  })
  @Get('comision/:comisionId')
  async findByComision(
    @Request() req,
    @Param('comisionId', ParseIntPipe) comisionId: number,
  ): Promise<Semana[]> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoComision(
          user.id,
          comisionId,
        );

      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta comisión');
      }
    }

    return this.semanaService.findByComision(comisionId);
  }

  @ApiOperation({
    summary: 'Obtener semanas visibles para un alumno',
    description:
      'Obtiene las semanas de una cursada filtradas por comisión del alumno y que ya hayan llegado a su fecha/hora de publicación',
  })
  @ApiParam({
    name: 'cursadaId',
    description: 'ID de la cursada',
    type: 'number',
  })
  @ApiParam({
    name: 'comisionId',
    description: 'ID de la comisión del alumno',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de semanas visibles para el alumno',
    type: [Semana],
  })
  @Get('cursada/:cursadaId/alumno/:comisionId')
  async findVisiblesParaAlumno(
    @Request() req,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
    @Param('comisionId', ParseIntPipe) comisionId: number,
  ): Promise<Semana[]> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const isAlumnoRole = userRoles.includes(USER_ROLES.ALUMNO);
      const cursada = isAlumnoRole
        ? null
        : await this.cursadaService.findAccessReference(cursadaId);
      const [tieneAccesoProfesor, tieneAccesoAlumno] = await Promise.all([
        cursada
          ? this.profesorMateriaService.verificarAccesoProfesor(
              user.id,
              cursada.materiaId,
            )
          : Promise.resolve(false),
        this.alumnoMateriaService.verificarAccesoAlumnoCursada(
          user.id,
          cursadaId,
          comisionId,
        ),
      ]);

      if (!tieneAccesoProfesor && !tieneAccesoAlumno) {
        throw new ForbiddenException('No tienes acceso a esta cursada');
      }
    }

    return this.semanaService.findVisiblesParaAlumno(cursadaId, comisionId);
  }

  @ApiOperation({ summary: 'Crear una nueva semana' })
  @ApiBody({ type: CreateSemanaDto })
  @ApiResponse({
    status: 201,
    description: 'Semana creada exitosamente',
    type: Semana,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @Post()
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async create(
    @Request() req,
    @Body() createSemanaDto: CreateSemanaDto,
  ): Promise<Semana> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const cursada = await this.cursadaService.findOne(
        createSemanaDto.cursadaId,
      );
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const semana = await this.semanaService.create(createSemanaDto);
    await this.materiaLogService.create({
      materiaId: semana.cursada.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.CREATED,
      resourceType: 'semana',
      resourceId: String(semana.id),
      title: 'Semana creada',
      detail: `Se creó la semana ${semana.numeroSemana}: "${semana.titulo}".`,
      metadata: createSemanaDto,
    });
    return semana;
  }

  @ApiOperation({ summary: 'Actualizar una semana' })
  @ApiParam({ name: 'id', description: 'ID de la semana', type: 'number' })
  @ApiBody({ type: UpdateSemanaDto })
  @ApiResponse({
    status: 200,
    description: 'Semana actualizada exitosamente',
    type: Semana,
  })
  @ApiResponse({
    status: 404,
    description: 'Semana no encontrada',
  })
  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSemanaDto: UpdateSemanaDto,
  ): Promise<Semana> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const semana = await this.semanaService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const semana = await this.semanaService.update(id, updateSemanaDto);
    await this.materiaLogService.create({
      materiaId: semana.cursada.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.UPDATED,
      resourceType: 'semana',
      resourceId: String(semana.id),
      title: 'Semana actualizada',
      detail: `Se actualizó la semana ${semana.numeroSemana}: "${semana.titulo}".`,
      metadata: updateSemanaDto,
    });
    return semana;
  }

  @ApiOperation({ summary: 'Eliminar una semana (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de la semana', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Semana eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Semana no encontrada',
  })
  @Delete(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async remove(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const semana = await this.semanaService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const semana = await this.semanaService.findOne(id);
    await this.semanaService.remove(id);
    await this.materiaLogService.create({
      materiaId: semana.cursada.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.DELETED,
      resourceType: 'semana',
      resourceId: String(semana.id),
      title: 'Semana eliminada',
      detail: `Se eliminó la semana ${semana.numeroSemana}: "${semana.titulo}".`,
    });
  }

  @ApiOperation({ summary: 'Restaurar una semana eliminada' })
  @ApiParam({ name: 'id', description: 'ID de la semana', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Semana restaurada exitosamente',
    type: Semana,
  })
  @ApiResponse({
    status: 404,
    description: 'Semana no encontrada',
  })
  @Patch(':id/restore')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Semana> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const semana = await this.semanaService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const semana = await this.semanaService.restore(id);
    await this.materiaLogService.create({
      materiaId: semana.cursada.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.RESTORED,
      resourceType: 'semana',
      resourceId: String(semana.id),
      title: 'Semana restaurada',
      detail: `Se restauró la semana ${semana.numeroSemana}: "${semana.titulo}".`,
    });
    return semana;
  }

  @ApiOperation({ summary: 'Duplicar una semana con sus recursos' })
  @ApiParam({ name: 'id', description: 'ID de la semana', type: 'number' })
  @Post(':id/duplicate')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async duplicate(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Semana> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];
    const original = await this.semanaService.findOne(id);

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          original.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const copia = await this.semanaService.duplicate(id);
    await this.materiaLogService.create({
      materiaId: copia.cursada.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.CREATED,
      resourceType: 'semana',
      resourceId: String(copia.id),
      title: 'Semana duplicada',
      detail: `Se duplicó la semana "${original.titulo}" como "${copia.titulo}".`,
      metadata: { sourceId: original.id },
    });
    return copia;
  }
}
