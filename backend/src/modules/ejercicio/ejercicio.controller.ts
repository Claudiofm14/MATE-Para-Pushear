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
import { EjercicioService } from './ejercicio.service';
import { Ejercicio } from '../../entities/ejercicio.entity';
import { CreateEjercicioDto, UpdateEjercicioDto } from './dto/ejercicio.dto';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
import { SemanaService } from '../semana/semana.service';

@ApiTags('Ejercicio')
@Controller('ejercicio')
export class EjercicioController {
  constructor(
    private readonly ejercicioService: EjercicioService,
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

  @ApiOperation({ summary: 'Obtener todos los ejercicios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los ejercicios',
    type: [Ejercicio],
  })
  @Roles(USER_ROLES.ADMIN)
  @Get()
  async findAll(): Promise<Ejercicio[]> {
    return this.ejercicioService.findAll();
  }

  @Get(':id/student-repo')
  @Roles(USER_ROLES.ALUMNO)
  @ApiOperation({
    summary: 'Consultar el repositorio Gitea propio (sin crear)',
  })
  async findStudentRepo(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    if (user.rol !== USER_ROLES.ALUMNO) {
      throw new ForbiddenException('Solo los alumnos consultan su repo');
    }
    const ejercicio = await this.ejercicioService.findOne(id);
    await this.assertCanReadSemana(req, ejercicio.semana.id);
    return await this.ejercicioService.findStudentRepo(id, user.id);
  }

  @Post(':id/student-repo')
  @Roles(USER_ROLES.ALUMNO)
  @ApiOperation({
    summary: 'Crear o recuperar repositorio Gitea del alumno para un ejercicio',
  })
  async ensureStudentRepo(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    if (user.rol !== USER_ROLES.ALUMNO) {
      throw new ForbiddenException('Solo los alumnos pueden generar su repo');
    }
    const ejercicio = await this.ejercicioService.findOne(id);
    await this.assertCanReadSemana(req, ejercicio.semana.id);
    return await this.ejercicioService.ensureStudentRepo(id, user);
  }

  @Get(':id/teacher-repo')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Obtener la copia docente de un ejercicio' })
  async findTeacherRepo(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    await this.assertCanManageExercise(req, user.id, id);
    return this.ejercicioService.findTeacherRepo(id, user.id);
  }

  @Post(':id/teacher-repo')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Crear o recuperar la copia docente privada de un ejercicio',
  })
  async ensureTeacherRepo(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    await this.assertCanManageExercise(req, user.id, id);
    return this.ejercicioService.ensureTeacherRepo(id, user);
  }

  @Get('materia/:materiaId/mis-repos')
  @Roles(USER_ROLES.ALUMNO)
  @ApiOperation({
    summary:
      'Listar repositorios Gitea del alumno en la cursada activa de una materia',
  })
  async findMyReposByMateria(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    if (user.rol !== USER_ROLES.ALUMNO) {
      throw new ForbiddenException('Solo los alumnos pueden ver sus repos');
    }

    const estado = await this.alumnoMateriaService.obtenerEstadoInscripcion(
      user.id,
      materiaId,
    );

    if (
      estado.estado !== 'aprobado' ||
      !estado.inscripcion?.comision?.cursada
    ) {
      throw new ForbiddenException('No tienes acceso a la cursada activa');
    }

    return this.ejercicioService.findStudentReposByMateria({
      materiaId,
      cursadaId: estado.inscripcion.comision.cursada.id,
      studentId: user.id,
    });
  }

  @ApiOperation({ summary: 'Obtener un ejercicio por ID' })
  @ApiParam({ name: 'id', description: 'ID del ejercicio', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Ejercicio encontrado',
    type: Ejercicio,
  })
  @ApiResponse({
    status: 404,
    description: 'Ejercicio no encontrado',
  })
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Ejercicio> {
    const ejercicio = await this.ejercicioService.findOne(id);
    await this.assertCanReadSemana(req, ejercicio.semana.id);
    return ejercicio;
  }

  @ApiOperation({ summary: 'Obtener ejercicios por semana' })
  @ApiParam({
    name: 'semanaId',
    description: 'ID de la semana',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ejercicios de la semana',
    type: [Ejercicio],
  })
  @Get('semana/:semanaId')
  async findBySemana(
    @Request() req,
    @Param('semanaId', ParseIntPipe) semanaId: number,
  ): Promise<Ejercicio[]> {
    await this.assertCanReadSemana(req, semanaId);
    return this.ejercicioService.findBySemana(semanaId);
  }

  @ApiOperation({ summary: 'Crear un nuevo ejercicio' })
  @ApiBody({ type: CreateEjercicioDto })
  @ApiResponse({
    status: 201,
    description: 'Ejercicio creado exitosamente',
    type: Ejercicio,
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
    @Body() createEjercicioDto: CreateEjercicioDto,
  ): Promise<Ejercicio> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const semana = await this.semanaService.findOne(
        createEjercicioDto.semanaId,
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
    return this.ejercicioService.create(createEjercicioDto, user);
  }

  @ApiOperation({ summary: 'Actualizar un ejercicio' })
  @ApiParam({ name: 'id', description: 'ID del ejercicio', type: 'number' })
  @ApiBody({ type: UpdateEjercicioDto })
  @ApiResponse({
    status: 200,
    description: 'Ejercicio actualizado exitosamente',
    type: Ejercicio,
  })
  @ApiResponse({
    status: 404,
    description: 'Ejercicio no encontrado',
  })
  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEjercicioDto: UpdateEjercicioDto,
  ): Promise<Ejercicio> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const ejercicio = await this.ejercicioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          ejercicio.semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.ejercicioService.update(id, updateEjercicioDto);
  }

  @ApiOperation({ summary: 'Eliminar un ejercicio (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del ejercicio', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Ejercicio eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Ejercicio no encontrado',
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
      const ejercicio = await this.ejercicioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          ejercicio.semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.ejercicioService.remove(id);
  }

  @ApiOperation({ summary: 'Restaurar un ejercicio eliminado' })
  @ApiParam({ name: 'id', description: 'ID del ejercicio', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Ejercicio restaurado exitosamente',
    type: Ejercicio,
  })
  @ApiResponse({
    status: 404,
    description: 'Ejercicio no encontrado',
  })
  @Patch(':id/restore')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Ejercicio> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const ejercicio = await this.ejercicioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          ejercicio.semana.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.ejercicioService.restore(id);
  }

  private async assertCanManageExercise(
    req: any,
    userId: number,
    exerciseId: number,
  ) {
    const roles = req.user.realm_access?.roles || [];
    if (roles.includes(USER_ROLES.ADMIN)) return;

    const ejercicio = await this.ejercicioService.findOne(exerciseId);
    const hasAccess = await this.profesorMateriaService.verificarAccesoProfesor(
      userId,
      ejercicio.semana.cursada.materia.id,
    );
    if (!hasAccess) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }
  }
}
