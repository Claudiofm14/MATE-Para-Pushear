import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Patch,
  ParseIntPipe,
  NotFoundException,
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
import { ContratoPedagogicoService } from './contrato-pedagogico.service';
import { ContratoPedagogico } from '../../entities/contrato_pedagogico.entity';
import {
  ContratoPedagogicoDto,
  UpdateContratoDto,
} from './dto/contrato-pedagogico.dto';
import { Contenedor } from '../../entities/contenedor.entity';
import { ContratoPedagogicoContenedor } from '../../entities/contrato-pedagogico-contenedor.entity';
import { MockUtils } from '../../utils/mock.utils';
import { CreateContenedorDto } from '../contenedor/dto/contenedor.dto';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';

@ApiTags('Contrato Pedagógico')
@ApiBearerAuth()
@Controller('contrato-pedagogico')
export class ContratoPedagogicoController {
  constructor(
    private readonly contratoService: ContratoPedagogicoService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
  ) {}

  private async assertCanReadMateria(req: any, materiaId: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const roles = req.user.realm_access?.roles || [];
    if (roles.includes(USER_ROLES.ADMIN)) return;

    const isProfesor =
      await this.profesorMateriaService.verificarAccesoProfesor(
        user.id,
        materiaId,
      );
    const isAlumno = await this.alumnoMateriaService.verificarAccesoAlumno(
      user.id,
      materiaId,
    );

    if (!isProfesor && !isAlumno) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }
  }

  @ApiOperation({ summary: 'Obtener todos los contratos pedagógicos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los contratos pedagógicos',
    type: [ContratoPedagogico],
    example: MockUtils.getContratoListExample(),
  })
  @Roles(USER_ROLES.ADMIN)
  @Get()
  async findAll(): Promise<ContratoPedagogico[]> {
    return this.contratoService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un contrato pedagógico por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del contrato pedagógico',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Contrato pedagógico encontrado',
    type: ContratoPedagogico,
    example: MockUtils.getContratoResponseExample(),
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato pedagógico no encontrado',
  })
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ContratoPedagogico> {
    const contrato = await this.contratoService.findOne(id);
    await this.assertCanReadMateria(req, contrato.materia.id);
    return contrato;
  }

  @ApiOperation({ summary: 'Obtener las secciones de un contrato pedagógico' })
  @ApiParam({
    name: 'id',
    description: 'ID del contrato pedagógico',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Secciones del contrato pedagógico',
    type: [ContratoPedagogicoContenedor],
    example: MockUtils.getSeccionesExample(),
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato pedagógico no encontrado',
  })
  @Get(':id/secciones')
  async findSecciones(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ContratoPedagogicoContenedor[]> {
    const contrato = await this.contratoService.findOne(id);
    await this.assertCanReadMateria(req, contrato.materia.id);
    return contrato.contenedores;
  }

  @ApiOperation({ summary: 'Crear un nuevo contrato pedagógico' })
  @ApiBody({ type: ContratoPedagogicoDto })
  @ApiResponse({
    status: 201,
    description: 'Contrato pedagógico creado exitosamente',
    type: ContratoPedagogico,
    example: MockUtils.getContratoResponseExample(),
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
    @Body() dto: ContratoPedagogicoDto,
  ): Promise<ContratoPedagogico> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          dto.materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.contratoService.create(dto);
  }

  @ApiOperation({ summary: 'Actualizar un contrato pedagógico existente' })
  @ApiParam({
    name: 'id',
    description: 'ID del contrato pedagógico',
    type: 'number',
  })
  @ApiBody({ type: UpdateContratoDto })
  @ApiResponse({
    status: 200,
    description: 'Contrato pedagógico actualizado exitosamente',
    type: ContratoPedagogico,
    example: MockUtils.getContratoResponseExample(),
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato pedagógico no encontrado',
  })
  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContratoDto,
  ): Promise<ContratoPedagogico> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const contrato = await this.contratoService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          contrato.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.contratoService.update(id, dto);
  }

  @ApiOperation({ summary: 'Eliminar un contrato pedagógico (soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'ID del contrato pedagógico',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Contrato pedagógico eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Contrato con ID 1 eliminado correctamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato pedagógico no encontrado',
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
      const contrato = await this.contratoService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          contrato.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    await this.contratoService.remove(id);
    return { message: `Contrato con ID ${id} eliminado correctamente` };
  }

  @ApiOperation({ summary: 'Restaurar un contrato pedagógico eliminado' })
  @ApiParam({
    name: 'id',
    description: 'ID del contrato pedagógico',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Contrato pedagógico restaurado exitosamente',
    type: ContratoPedagogico,
    example: MockUtils.getContratoResponseExample(),
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato pedagógico no encontrado',
  })
  @Patch(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ContratoPedagogico> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const contrato = await this.contratoService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          contrato.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.contratoService.restore(id);
  }

  @ApiOperation({
    summary: 'Agregar un contenedor a un contrato pedagógico existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del contrato pedagógico',
    type: 'number',
  })
  @ApiBody({ type: CreateContenedorDto })
  @ApiResponse({
    status: 201,
    description: 'Contenedor agregado exitosamente',
    type: ContratoPedagogico,
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato pedagógico no encontrado',
  })
  @Post(':id/contenedores')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async addContenedor(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() createContenedorDto: CreateContenedorDto,
  ): Promise<ContratoPedagogico> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const contrato = await this.contratoService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          contrato.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.contratoService.addContenedor(id, createContenedorDto);
  }

  @ApiOperation({ summary: 'Eliminar un contenedor de un contrato pedagógico' })
  @ApiParam({
    name: 'id',
    description: 'ID del contrato pedagógico',
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
    type: ContratoPedagogico,
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato pedagógico o contenedor no encontrado',
  })
  @Delete(':id/contenedores/:contenedorId')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async removeContenedor(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('contenedorId', ParseIntPipe) contenedorId: number,
  ): Promise<ContratoPedagogico> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const contrato = await this.contratoService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          contrato.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.contratoService.removeContenedor(id, contenedorId);
  }
}
