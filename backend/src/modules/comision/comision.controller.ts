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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ComisionService } from './comision.service';
import { Comision } from '../../entities/comision.entity';
import { CreateComisionDto, UpdateComisionDto } from './dto/comision.dto';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
import { CursadaService } from '../cursada/cursada.service';

@ApiTags('Comision')
@Controller('comision')
export class ComisionController {
  constructor(
    private readonly comisionService: ComisionService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
    private readonly cursadaService: CursadaService,
  ) {}

  private async assertCanReadComision(req: any, comision: Comision) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const roles = req.user.realm_access?.roles || [];
    if (roles.includes(USER_ROLES.ADMIN)) return;

    const isProfesor =
      await this.profesorMateriaService.verificarAccesoComision(
        user.id,
        comision.id,
      );
    const isAlumno =
      await this.alumnoMateriaService.verificarAccesoAlumnoCursada(
        user.id,
        comision.cursada.id,
        comision.id,
      );

    if (!isProfesor && !isAlumno) {
      throw new ForbiddenException('No tienes acceso a esta comision');
    }
  }

  @ApiOperation({
    summary: 'Obtener comisiones disponibles para solicitar inscripcion',
  })
  @ApiParam({
    name: 'materiaId',
    description: 'ID de la materia',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comisiones disponibles para solicitar inscripcion',
    type: [Comision],
  })
  @Get('materia/:materiaId/inscripcion')
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async findByMateriaForInscripcion(
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ): Promise<Comision[]> {
    const cursadas = await this.cursadaService.findByMateria(materiaId);
    const cursadaActiva = cursadas.find((cursada) => cursada.activa);

    if (!cursadaActiva) return [];

    return this.comisionService.findByCursada(cursadaActiva.id);
  }

  private async canReadCursada(req: any, cursadaId: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const roles = req.user.realm_access?.roles || [];
    if (roles.includes(USER_ROLES.ADMIN)) return 'admin';

    const cursada = await this.cursadaService.findOne(cursadaId);
    const isProfesor =
      await this.profesorMateriaService.verificarAccesoProfesor(
        user.id,
        cursada.materia.id,
      );
    if (isProfesor) return 'profesor';

    const isAlumno =
      await this.alumnoMateriaService.verificarAccesoAlumnoCursada(
        user.id,
        cursadaId,
      );
    if (isAlumno) return 'alumno';

    throw new ForbiddenException('No tienes acceso a esta cursada');
  }

  @ApiOperation({ summary: 'Obtener todas las comisiones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas las comisiones',
    type: [Comision],
  })
  @Roles(USER_ROLES.ADMIN)
  @Get()
  async findAll(@Query('activas') activas?: string): Promise<Comision[]> {
    return this.comisionService.findAll(activas === 'true');
  }

  @ApiOperation({ summary: 'Obtener una comisión por ID' })
  @ApiParam({ name: 'id', description: 'ID de la comisión', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Comisión encontrada',
    type: Comision,
  })
  @ApiResponse({
    status: 404,
    description: 'Comisión no encontrada',
  })
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Comision> {
    const comision = await this.comisionService.findOne(id);
    await this.assertCanReadComision(req, comision);
    return comision;
  }

  @ApiOperation({ summary: 'Obtener comisiones por cursada' })
  @ApiParam({
    name: 'cursadaId',
    description: 'ID de la cursada',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comisiones disponibles para solicitar inscripcion',
    type: [Comision],
  })
  @Get('cursada/:cursadaId/inscripcion')
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async findByCursadaForInscripcion(
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
  ): Promise<Comision[]> {
    const cursada = await this.cursadaService.findOne(cursadaId);
    if (!cursada.activa) return [];

    return this.comisionService.findByCursada(cursadaId);
  }

  @ApiOperation({ summary: 'Obtener comisiones por cursada' })
  @ApiParam({
    name: 'cursadaId',
    description: 'ID de la cursada',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comisiones de la cursada',
    type: [Comision],
  })
  @Get('cursada/:cursadaId')
  async findByCursada(
    @Request() req,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
  ): Promise<Comision[]> {
    const access = await this.canReadCursada(req, cursadaId);
    const comisiones = await this.comisionService.findByCursada(cursadaId);
    if (access !== 'alumno') return comisiones;

    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const allowed = await Promise.all(
      comisiones.map(async (comision) => ({
        comision,
        allowed: await this.alumnoMateriaService.verificarAccesoAlumnoCursada(
          user.id,
          cursadaId,
          comision.id,
        ),
      })),
    );
    return allowed.filter((item) => item.allowed).map((item) => item.comision);
  }

  @ApiOperation({ summary: 'Crear una nueva comisión' })
  @ApiBody({ type: CreateComisionDto })
  @ApiResponse({
    status: 201,
    description: 'Comisión creada exitosamente',
    type: Comision,
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
    @Body() createComisionDto: CreateComisionDto,
  ): Promise<Comision> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const cursada = await this.cursadaService.findOne(
        createComisionDto.cursadaId,
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
    return this.comisionService.create(createComisionDto);
  }

  @ApiOperation({ summary: 'Actualizar una comisión' })
  @ApiParam({ name: 'id', description: 'ID de la comisión', type: 'number' })
  @ApiBody({ type: UpdateComisionDto })
  @ApiResponse({
    status: 200,
    description: 'Comisión actualizada exitosamente',
    type: Comision,
  })
  @ApiResponse({
    status: 404,
    description: 'Comisión no encontrada',
  })
  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateComisionDto: UpdateComisionDto,
  ): Promise<Comision> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const comision = await this.comisionService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          comision.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.comisionService.update(id, updateComisionDto);
  }

  @ApiOperation({ summary: 'Eliminar una comisión (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de la comisión', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Comisión eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Comisión no encontrada',
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
      const comision = await this.comisionService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          comision.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.comisionService.remove(id);
  }

  @ApiOperation({ summary: 'Restaurar una comisión eliminada' })
  @ApiParam({ name: 'id', description: 'ID de la comisión', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Comisión restaurada exitosamente',
    type: Comision,
  })
  @ApiResponse({
    status: 404,
    description: 'Comisión no encontrada',
  })
  @Patch(':id/restore')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Comision> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const comision = await this.comisionService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          comision.cursada.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.comisionService.restore(id);
  }
}
