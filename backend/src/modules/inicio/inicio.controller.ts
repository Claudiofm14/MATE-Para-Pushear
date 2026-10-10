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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateInicioDto, UpdateInicioDto } from './dto/inicio.dto';
import { CreateContenedorDto } from '../contenedor/dto/contenedor.dto';
import { InicioService } from './inicio.service';
import { Inicio } from '../../entities/inicio.entity';
import { USER_ROLES, Roles } from '../../auth';
import { MockUtils } from '../../utils/mock.utils';
import { Public } from '../../auth';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';

@ApiTags('Inicio')
@ApiBearerAuth()
@Controller('inicio')
export class InicioController {
  constructor(
    private readonly inicioService: InicioService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
  ) {}

  private async verificarAccesoMateria(req: any, materiaId: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];
    const isAdmin = userRoles.includes(USER_ROLES.ADMIN);
    const tieneAccesoProfesor =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        user.id,
        materiaId,
      ));
    const tieneAccesoAlumno =
      await this.alumnoMateriaService.verificarAccesoAlumno(user.id, materiaId);

    if (!tieneAccesoProfesor && !tieneAccesoAlumno) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }
  }

  @ApiOperation({ summary: 'Obtener todas las páginas de inicio' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas las páginas de inicio',
    type: [Inicio],
    example: MockUtils.getInicioListExample(),
  })
  @Get()
  @Roles(USER_ROLES.ADMIN)
  async findAll(): Promise<Inicio[]> {
    return this.inicioService.findAll();
  }

  @ApiOperation({ summary: 'Obtener el inicio de una materia específica' })
  @ApiParam({
    name: 'materiaId',
    description: 'ID de la materia',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Página de inicio de la materia encontrada',
    type: Inicio,
    example: MockUtils.getInicioResponseExample(),
  })
  @ApiResponse({
    status: 404,
    description: 'Inicio de la materia no encontrado',
  })
  @Get('materia/:materiaId')
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async findByMateria(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ): Promise<Inicio> {
    await this.verificarAccesoMateria(req, materiaId);
    return this.inicioService.findByMateria(materiaId);
  }

  @ApiOperation({ summary: 'Obtener una página de inicio por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la página de inicio',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Página de inicio encontrada',
    type: Inicio,
    example: MockUtils.getInicioResponseExample(),
  })
  @ApiResponse({
    status: 404,
    description: 'Página de inicio no encontrada',
  })
  @Get(':id')
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Inicio> {
    const inicio = await this.inicioService.findOne(id);
    await this.verificarAccesoMateria(req, inicio.materia.id);
    return inicio;
  }

  @ApiOperation({ summary: 'Crear una nueva página de inicio' })
  @ApiBody({ type: CreateInicioDto })
  @ApiResponse({
    status: 201,
    description: 'Página de inicio creada exitosamente',
    type: Inicio,
    example: MockUtils.getInicioResponseExample(),
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
    @Body() createInicioDto: CreateInicioDto,
  ): Promise<Inicio> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          createInicioDto.materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.inicioService.create(createInicioDto);
  }

  @ApiOperation({ summary: 'Actualizar una página de inicio existente' })
  @ApiParam({
    name: 'id',
    description: 'ID de la página de inicio',
    type: 'number',
  })
  @ApiBody({ type: UpdateInicioDto })
  @ApiResponse({
    status: 200,
    description: 'Página de inicio actualizada exitosamente',
    type: Inicio,
  })
  @ApiResponse({
    status: 404,
    description: 'Página de inicio no encontrada',
  })
  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInicioDto: UpdateInicioDto,
  ): Promise<Inicio> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const inicio = await this.inicioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          inicio.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.inicioService.update(id, updateInicioDto);
  }

  @ApiOperation({ summary: 'Eliminar una página de inicio (soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'ID de la página de inicio',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Página de inicio eliminada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Inicio con ID 1 eliminado correctamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Página de inicio no encontrada',
  })
  @Delete(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async remove(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const inicio = await this.inicioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          inicio.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    await this.inicioService.remove(id);
    return { message: `Inicio con ID ${id} eliminado correctamente` };
  }

  @ApiOperation({ summary: 'Restaurar una página de inicio eliminada' })
  @ApiParam({
    name: 'id',
    description: 'ID de la página de inicio',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Página de inicio restaurada exitosamente',
    type: Inicio,
  })
  @ApiResponse({
    status: 404,
    description: 'Página de inicio no encontrada',
  })
  @Patch(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Inicio> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const inicio = await this.inicioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          inicio.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.inicioService.restore(id);
  }

  @ApiOperation({
    summary: 'Agregar un nuevo contenedor a una página de inicio existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la página de inicio',
    type: 'number',
  })
  @ApiBody({ type: CreateContenedorDto })
  @ApiResponse({
    status: 201,
    description: 'Contenedor agregado exitosamente',
    type: Inicio,
  })
  @ApiResponse({
    status: 404,
    description: 'Página de inicio no encontrada',
  })
  @Post(':id/contenedores')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async addContenedor(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() contenedorDto: CreateContenedorDto,
  ): Promise<Inicio> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const inicio = await this.inicioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          inicio.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.inicioService.addContenedor(id, contenedorDto);
  }

  @ApiOperation({ summary: 'Eliminar un contenedor de una página de inicio' })
  @ApiParam({
    name: 'id',
    description: 'ID de la página de inicio',
    type: 'number',
  })
  @ApiParam({
    name: 'contenedorId',
    description: 'ID del contenedor a eliminar',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Contenedor eliminado exitosamente',
    type: Inicio,
  })
  @ApiResponse({
    status: 404,
    description: 'Página de inicio o contenedor no encontrado',
  })
  @Delete(':id/contenedores/:contenedorId')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async removeContenedor(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('contenedorId', ParseIntPipe) contenedorId: number,
  ): Promise<Inicio> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const inicio = await this.inicioService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          inicio.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.inicioService.removeContenedor(id, contenedorId);
  }
}
