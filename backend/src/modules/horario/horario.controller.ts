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
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { HorarioService } from './horario.service';
import { Horario } from '../../entities/horario.entity';
import {
  CreateHorarioDto,
  ReorderHorariosDto,
  UpdateHorarioDto,
} from './dto/horario.dto';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
import { SemanaService } from '../semana/semana.service';

@ApiTags('Horario')
@Controller('horario')
export class HorarioController {
  constructor(
    private readonly horarioService: HorarioService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
    private readonly semanaService: SemanaService,
  ) {}

  private async assertCanReadSemana(req: any, semanaId: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const roles = req.user.realm_access?.roles || [];
    if (roles.includes(USER_ROLES.ADMIN)) return;

    const semana = await this.semanaService.findOne(semanaId);
    const isProfesor =
      await this.profesorMateriaService.verificarAccesoProfesor(
        user.id,
        semana.cursada.materia.id,
      );
    if (isProfesor) return;

    const comisionIds = semana.comisiones?.map((comision) => comision.id) || [];
    const canRead = await Promise.all(
      comisionIds.map(async (comisionId) => {
        const hasAccess =
          await this.alumnoMateriaService.verificarAccesoAlumnoCursada(
            user.id,
            semana.cursada.id,
            comisionId,
          );
        if (!hasAccess) return false;

        const visibles = await this.semanaService.findVisiblesParaAlumno(
          semana.cursada.id,
          comisionId,
        );
        return visibles.some((visible) => visible.id === semana.id);
      }),
    );

    if (!canRead.some(Boolean)) {
      throw new ForbiddenException('No tienes acceso a esta semana');
    }
  }

  @ApiOperation({ summary: 'Obtener todos los horarios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los horarios',
    type: [Horario],
  })
  @Roles(USER_ROLES.ADMIN)
  @Get()
  async findAll(): Promise<Horario[]> {
    return this.horarioService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un horario por ID' })
  @ApiParam({ name: 'id', description: 'ID del horario', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Horario encontrado',
    type: Horario,
  })
  @ApiResponse({
    status: 404,
    description: 'Horario no encontrado',
  })
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Horario> {
    const horario = await this.horarioService.findOne(id);
    await this.assertCanReadSemana(req, horario.semana.id);
    return horario;
  }

  @ApiOperation({ summary: 'Obtener horarios por semana' })
  @ApiParam({
    name: 'semanaId',
    description: 'ID de la semana',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de horarios de la semana',
    type: [Horario],
  })
  @Get('semana/:semanaId')
  async findBySemana(
    @Request() req,
    @Param('semanaId', ParseIntPipe) semanaId: number,
  ): Promise<Horario[]> {
    await this.assertCanReadSemana(req, semanaId);
    return this.horarioService.findBySemana(semanaId);
  }

  @ApiOperation({ summary: 'Crear un nuevo horario' })
  @ApiBody({ type: CreateHorarioDto })
  @ApiResponse({
    status: 201,
    description: 'Horario creado exitosamente',
    type: Horario,
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
    @Body() createHorarioDto: CreateHorarioDto,
  ): Promise<Horario> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const semana = await this.semanaService.findOne(
        createHorarioDto.semanaId,
      );
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.horarioService.create(createHorarioDto);
  }

  @ApiOperation({ summary: 'Reordenar los horarios de una semana' })
  @ApiBody({ type: ReorderHorariosDto })
  @Put('semana/:semanaId/orden')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async reorder(
    @Request() req,
    @Param('semanaId', ParseIntPipe) semanaId: number,
    @Body() reorderDto: ReorderHorariosDto,
  ): Promise<Horario[]> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const semana = await this.semanaService.findOne(semanaId);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    return this.horarioService.reorder(semanaId, reorderDto.horarioIds);
  }

  @ApiOperation({ summary: 'Actualizar un horario' })
  @ApiParam({ name: 'id', description: 'ID del horario', type: 'number' })
  @ApiBody({ type: UpdateHorarioDto })
  @ApiResponse({
    status: 200,
    description: 'Horario actualizado exitosamente',
    type: Horario,
  })
  @ApiResponse({
    status: 404,
    description: 'Horario no encontrado',
  })
  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHorarioDto: UpdateHorarioDto,
  ): Promise<Horario> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const horario = await this.horarioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          horario.semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.horarioService.update(id, updateHorarioDto);
  }

  @ApiOperation({ summary: 'Eliminar un horario (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del horario', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Horario eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Horario no encontrado',
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
      const horario = await this.horarioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          horario.semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.horarioService.remove(id);
  }

  @ApiOperation({ summary: 'Restaurar un horario eliminado' })
  @ApiParam({ name: 'id', description: 'ID del horario', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Horario restaurado exitosamente',
    type: Horario,
  })
  @ApiResponse({
    status: 404,
    description: 'Horario no encontrado',
  })
  @Patch(':id/restore')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Horario> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const horario = await this.horarioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          horario.semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.horarioService.restore(id);
  }
}
