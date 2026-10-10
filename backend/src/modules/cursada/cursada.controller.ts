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
import { CursadaService } from './cursada.service';
import { Cursada } from '../../entities/cursada.entity';
import { CreateCursadaDto, UpdateCursadaDto } from './dto/cursada.dto';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
import { Request as ExpressRequest } from 'express';
import { MateriaLogService } from '../materia-log/materia-log.service';
import { MateriaLogAction } from '../../entities/materia-log.entity';

@ApiTags('Cursada')
@Controller('cursada')
export class CursadaController {
  constructor(
    private readonly cursadaService: CursadaService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
    private readonly materiaLogService: MateriaLogService,
  ) {}

  private getActor(user: any) {
    return {
      usuarioId: user.id,
      actorNombre: `${user.nombre} ${user.apellido}`.trim(),
      actorEmail: user.email,
    };
  }

  private async assertCanReadMateria(req: any, materiaId: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const roles = req.user.realm_access?.roles || [];
    if (roles.includes(USER_ROLES.ADMIN)) return;

    const isAlumnoRole = roles.includes(USER_ROLES.ALUMNO);
    const [isProfesor, isAlumno] = await Promise.all([
      isAlumnoRole
        ? Promise.resolve(false)
        : this.profesorMateriaService.verificarAccesoProfesor(
            user.id,
            materiaId,
          ),
      this.alumnoMateriaService.verificarAccesoAlumno(user.id, materiaId),
    ]);

    if (!isProfesor && !isAlumno) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }
  }

  private async assertCanReadCursada(req: any, cursada: Cursada) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const roles = req.user.realm_access?.roles || [];
    if (roles.includes(USER_ROLES.ADMIN)) return;

    const isAlumnoRole = roles.includes(USER_ROLES.ALUMNO);
    const [isProfesor, isAlumno] = await Promise.all([
      isAlumnoRole
        ? Promise.resolve(false)
        : this.profesorMateriaService.verificarAccesoProfesor(
            user.id,
            cursada.materia.id,
          ),
      this.alumnoMateriaService.verificarAccesoAlumnoCursada(
        user.id,
        cursada.id,
      ),
    ]);

    if (!isProfesor && !isAlumno) {
      throw new ForbiddenException('No tienes acceso a esta cursada');
    }
  }

  @ApiOperation({ summary: 'Obtener todas las cursadas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas las cursadas',
    type: [Cursada],
  })
  @Roles(USER_ROLES.ADMIN)
  @Get()
  async findAll(): Promise<Cursada[]> {
    return this.cursadaService.findAll();
  }

  @ApiOperation({ summary: 'Obtener una cursada por ID' })
  @ApiParam({ name: 'id', description: 'ID de la cursada', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Cursada encontrada',
    type: Cursada,
  })
  @ApiResponse({
    status: 404,
    description: 'Cursada no encontrada',
  })
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cursada> {
    const cursada = await this.cursadaService.findOne(id);
    await this.assertCanReadCursada(req, cursada);
    return cursada;
  }

  @ApiOperation({ summary: 'Obtener cursadas por materia' })
  @ApiParam({
    name: 'materiaId',
    description: 'ID de la materia',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursadas de la materia',
    type: [Cursada],
  })
  @Get('materia/:materiaId')
  async findByMateria(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ): Promise<Cursada[]> {
    await this.assertCanReadMateria(req, materiaId);
    return this.cursadaService.findByMateria(materiaId);
  }

  @ApiOperation({ summary: 'Crear una nueva cursada' })
  @ApiBody({ type: CreateCursadaDto })
  @ApiResponse({
    status: 201,
    description: 'Cursada creada exitosamente',
    type: Cursada,
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
    @Body() createCursadaDto: CreateCursadaDto,
  ): Promise<Cursada> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          createCursadaDto.materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const cursada = await this.cursadaService.create(createCursadaDto);
    await this.materiaLogService.create({
      materiaId: createCursadaDto.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.CREATED,
      resourceType: 'cursada',
      resourceId: String(cursada.id),
      title: 'Cursada creada',
      detail: `Se creó la cursada "${cursada.titulo}".`,
      metadata: createCursadaDto,
    });
    return cursada;
  }

  @ApiOperation({ summary: 'Actualizar una cursada' })
  @ApiParam({ name: 'id', description: 'ID de la cursada', type: 'number' })
  @ApiBody({ type: UpdateCursadaDto })
  @ApiResponse({
    status: 200,
    description: 'Cursada actualizada exitosamente',
    type: Cursada,
  })
  @ApiResponse({
    status: 404,
    description: 'Cursada no encontrada',
  })
  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCursadaDto: UpdateCursadaDto,
  ): Promise<Cursada> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const cursada = await this.cursadaService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const cursada = await this.cursadaService.update(id, updateCursadaDto);
    await this.materiaLogService.create({
      materiaId: cursada.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.UPDATED,
      resourceType: 'cursada',
      resourceId: String(cursada.id),
      title: 'Cursada actualizada',
      detail: `Se actualizó la cursada "${cursada.titulo}".`,
      metadata: updateCursadaDto,
    });
    return cursada;
  }

  @ApiOperation({ summary: 'Finalizar una cursada sin borrar su contenido' })
  @ApiParam({ name: 'id', description: 'ID de la cursada', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Cursada finalizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cursada no encontrada',
  })
  @Delete(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async remove(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cursada> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const cursada = await this.cursadaService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const cursada = await this.cursadaService.findOne(id);
    const cursadaFinalizada = await this.cursadaService.remove(id);
    await this.materiaLogService.create({
      materiaId: cursada.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.FINALIZED,
      resourceType: 'cursada',
      resourceId: String(cursada.id),
      title: 'Cursada finalizada',
      detail: `Se eliminó la cursada "${cursada.titulo}".`,
    });
    return cursadaFinalizada;
  }

  @ApiOperation({ summary: 'Finalizar una cursada' })
  @ApiParam({ name: 'id', description: 'ID de la cursada', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Cursada finalizada exitosamente',
    type: Cursada,
  })
  @Patch(':id/finalizar')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async finalizar(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cursada> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const cursada = await this.cursadaService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const cursada = await this.cursadaService.finalizar(id);
    await this.materiaLogService.create({
      materiaId: cursada.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.FINALIZED,
      resourceType: 'cursada',
      resourceId: String(cursada.id),
      title: 'Cursada finalizada',
      detail: `Se finalizó la cursada "${cursada.titulo}".`,
      metadata: { fechaFin: cursada.fechaFin },
    });
    return cursada;
  }

  @ApiOperation({ summary: 'Restaurar una cursada eliminada' })
  @ApiParam({ name: 'id', description: 'ID de la cursada', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Cursada restaurada exitosamente',
    type: Cursada,
  })
  @ApiResponse({
    status: 404,
    description: 'Cursada no encontrada',
  })
  @Patch(':id/restore')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cursada> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const cursada = await this.cursadaService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    return this.cursadaService.restore(id);
  }

  @ApiOperation({ summary: 'Duplicar una cursada con su estructura' })
  @ApiParam({ name: 'id', description: 'ID de la cursada', type: 'number' })
  @Post(':id/duplicate')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async duplicate(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Cursada> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];
    const original = await this.cursadaService.findOne(id);

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          original.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const copia = await this.cursadaService.duplicate(id);
    await this.materiaLogService.create({
      materiaId: copia.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.CREATED,
      resourceType: 'cursada',
      resourceId: String(copia.id),
      title: 'Cursada duplicada',
      detail: `Se duplicó la cursada "${original.titulo}" como "${copia.titulo}".`,
      metadata: { sourceId: original.id },
    });
    return copia;
  }
}
