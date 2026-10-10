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
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { MaterialService } from './material.service';
import { Material } from '../../entities/material.entity';
import { MockUtils } from '../../utils/mock.utils';
import { CreateContenedorDto } from '../contenedor/dto/contenedor.dto';
import { USER_ROLES, Roles } from '../../auth';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
@ApiTags('Material')
@ApiBearerAuth()
@Controller('material')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
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

  @ApiOperation({ summary: 'Obtener todos los materiales' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los materiales',
    type: [Material],
    example: MockUtils.getMaterialListExample(),
  })
  @Get()
  @Roles(USER_ROLES.ADMIN)
  async findAll(): Promise<Material[]> {
    return this.materialService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un material por ID' })
  @ApiParam({ name: 'id', description: 'ID del material', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Material encontrado',
    type: Material,
    example: MockUtils.getMaterialResponseExample(),
  })
  @ApiResponse({
    status: 404,
    description: 'Material no encontrado',
  })
  @Get(':id')
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Material> {
    const material = await this.materialService.findOne(id);
    await this.assertCanReadMateria(req, material.materia.id);
    return material;
  }

  @ApiOperation({ summary: 'Crear un nuevo material' })
  @ApiBody({ type: CreateMaterialDto })
  @ApiResponse({
    status: 201,
    description: 'Material creado exitosamente',
    type: Material,
    example: MockUtils.getMaterialResponseExample(),
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @Post()
  @Post()
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async create(
    @Request() req,
    @Body() createMaterialDto: CreateMaterialDto,
  ): Promise<Material> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          createMaterialDto.materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.materialService.create(createMaterialDto);
  }

  @ApiOperation({ summary: 'Actualizar un material existente' })
  @ApiParam({ name: 'id', description: 'ID del material', type: 'number' })
  @ApiBody({ type: UpdateMaterialDto })
  @ApiResponse({
    status: 200,
    description: 'Material actualizado exitosamente',
    type: Material,
  })
  @ApiResponse({
    status: 404,
    description: 'Material no encontrado',
  })
  @Put(':id')
  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ): Promise<Material> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const material = await this.materialService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          material.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.materialService.update(id, updateMaterialDto);
  }

  @ApiOperation({ summary: 'Eliminar un material (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del material', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Material eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Material con ID 1 eliminado correctamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Material no encontrado',
  })
  @Delete(':id')
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
      const material = await this.materialService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          material.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    await this.materialService.remove(id);
    return { message: `Material con ID ${id} eliminado correctamente` };
  }

  @ApiOperation({ summary: 'Restaurar un material eliminado' })
  @ApiParam({ name: 'id', description: 'ID del material', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Material restaurado exitosamente',
    type: Material,
  })
  @ApiResponse({
    status: 404,
    description: 'Material no encontrado',
  })
  @Patch(':id')
  @Patch(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Material> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const material = await this.materialService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          material.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.materialService.restore(id);
  }

  @ApiOperation({ summary: 'Agregar un contenedor a un material existente' })
  @ApiParam({ name: 'id', description: 'ID del material', type: 'number' })
  @ApiBody({ type: CreateContenedorDto })
  @ApiResponse({
    status: 201,
    description: 'Contenedor agregado exitosamente',
    type: Material,
  })
  @ApiResponse({
    status: 404,
    description: 'Material no encontrado',
  })
  @Post(':id/contenedores')
  @Post(':id/contenedores')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async addContenedor(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() createContenedorDto: CreateContenedorDto,
  ): Promise<Material> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const material = await this.materialService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          material.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.materialService.addContenedor(id, createContenedorDto);
  }

  @ApiOperation({ summary: 'Eliminar un contenedor de un material' })
  @ApiParam({ name: 'id', description: 'ID del material', type: 'number' })
  @ApiParam({
    name: 'contenedorId',
    description: 'ID del contenedor a eliminar',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Contenedor eliminado exitosamente',
    type: Material,
  })
  @ApiResponse({
    status: 404,
    description: 'Material o contenedor no encontrado',
  })
  @Delete(':id/contenedores/:contenedorId')
  @Delete(':id/contenedores/:contenedorId')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async removeContenedor(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('contenedorId', ParseIntPipe) contenedorId: number,
  ): Promise<Material> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const material = await this.materialService.findOne(id);
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          material.materia.id,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }
    return this.materialService.removeContenedor(id, contenedorId);
  }
}
