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
import { MateriaService } from './materia.service';
import { Materia } from '../../entities/materia.entity';
import { CreateMateriaDto, UpdateMateriaDto } from './dto/materia.dto';
import { UpdateMateriaConfigDto } from './dto/materia-config.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
import { MateriaLogService } from '../materia-log/materia-log.service';
import { MateriaLogAction } from '../../entities/materia-log.entity';
import { AdminAuditAction } from '../../entities/admin-audit-log.entity';

@ApiTags('Materia')
@Controller('materia')
export class MateriaController {
  constructor(
    private readonly materiaService: MateriaService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
    private readonly materiaLogService: MateriaLogService,
  ) {}

  @ApiOperation({ summary: 'Obtener todas las materias' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas las materias',
    type: [Materia],
  })
  @Public()
  @Get()
  async findAll(): Promise<Partial<Materia>[]> {
    return this.materiaService.findPublicAll();
  }

  private isAdmin(req: any): boolean {
    const userRoles = req.user?.realm_access?.roles || [];
    return userRoles.includes(USER_ROLES.ADMIN);
  }

  private async assertCanManageMateria(req: any, materiaId: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    return user;
  }

  private async assertCanReadMateria(req: any, materiaId: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (userRoles.includes(USER_ROLES.ADMIN)) {
      return;
    }

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

  @ApiOperation({ summary: 'Obtener configuración de una materia' })
  @Get(':id/configuracion')
  async getConfiguracion(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Record<string, any>> {
    await this.assertCanReadMateria(req, id);
    return this.materiaService.getConfiguracion(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar configuración de una materia' })
  @Put(':id/configuracion')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async updateConfiguracion(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConfigDto: UpdateMateriaConfigDto,
  ): Promise<Record<string, any>> {
    const user = await this.assertCanManageMateria(req, id);
    const config = await this.materiaService.updateConfiguracion(
      id,
      updateConfigDto,
    );

    await this.materiaLogService.create({
      materiaId: id,
      usuarioId: user.id,
      actorNombre: `${user.nombre} ${user.apellido}`.trim(),
      actorEmail: user.email,
      action: MateriaLogAction.CONFIG_UPDATED,
      resourceType: 'materia_configuracion',
      resourceId: String(id),
      title: 'Configuración de materia actualizada',
      detail: 'Se modificaron solapas visibles o encabezados de páginas.',
      metadata: updateConfigDto,
    });

    return config;
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar materias archivadas (solo admin)',
    description:
      'Una materia archivada conserva todo su contenido pero no aparece en ninguna vista de alumnos ni docentes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de materias archivadas',
    type: [Materia],
  })
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Get('archivadas')
  async findArchivadas(): Promise<Partial<Materia>[]> {
    return this.materiaService.findArchivadas();
  }

  @ApiOperation({ summary: 'Obtener una materia por ID' })
  @ApiParam({ name: 'id', description: 'ID de la materia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Materia encontrada',
    type: Materia,
  })
  @ApiResponse({
    status: 404,
    description: 'Materia no encontrada',
  })
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Partial<Materia>> {
    return this.materiaService.findPublicOne(id, {
      incluirArchivadas: this.isAdmin(req),
    });
  }

  @ApiOperation({ summary: 'Obtener una materia por código' })
  @ApiParam({
    name: 'codigo',
    description: 'Código único de la materia',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Materia encontrada',
    type: Materia,
  })
  @ApiResponse({
    status: 404,
    description: 'Materia no encontrada',
  })
  @Get('codigo/:codigo')
  async findByCodigo(
    @Request() req,
    @Param('codigo') codigo: string,
  ): Promise<Partial<Materia>> {
    return this.materiaService.findPublicByCodigo(codigo, {
      incluirArchivadas: this.isAdmin(req),
    });
  }

  @ApiOperation({ summary: 'Crear una nueva materia' })
  @ApiBody({ type: CreateMateriaDto })
  @ApiResponse({
    status: 201,
    description: 'Materia creada exitosamente',
    type: Materia,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'El código de materia ya existe',
  })
  @Roles(USER_ROLES.ADMIN)
  @Post()
  async create(
    @Request() req,
    @Body() createMateriaDto: CreateMateriaDto,
  ): Promise<Materia> {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const materia = await this.materiaService.create(createMateriaDto);
    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.MATERIA_CREATED,
      title: 'Materia creada',
      detail: `${actor.email} creo la materia ${materia.nombre}.`,
      newValues: {
        id: materia.id,
        nombre: materia.nombre,
        codigo: materia.codigo,
      },
      correlationId: req.correlationId,
    });
    return materia;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una materia existente' })
  @ApiParam({ name: 'id', description: 'ID de la materia', type: 'number' })
  @ApiBody({ type: UpdateMateriaDto })
  @ApiResponse({
    status: 200,
    description: 'Materia actualizada exitosamente',
    type: Materia,
  })
  @ApiResponse({
    status: 404,
    description: 'Materia no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'El código de materia ya existe',
  })
  @Roles(USER_ROLES.ADMIN)
  @Put(':id')
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMateriaDto: UpdateMateriaDto,
  ): Promise<Materia> {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const before = await this.materiaService.findOne(id);
    const materia = await this.materiaService.update(id, updateMateriaDto);
    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.MATERIA_UPDATED,
      title: 'Materia actualizada',
      detail: `${actor.email} actualizo la materia ${materia.nombre}.`,
      previousValues: { nombre: before.nombre, codigo: before.codigo },
      newValues: { nombre: materia.nombre, codigo: materia.codigo },
      correlationId: req.correlationId,
    });
    return materia;
  }

  @ApiOperation({ summary: 'Eliminar una materia (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de la materia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Materia eliminada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Materia con ID 1 eliminada correctamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Materia no encontrada',
  })
  @Roles(USER_ROLES.ADMIN)
  @Delete(':id')
  async remove(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const materia = await this.materiaService.findOne(id);
    await this.materiaService.remove(id);
    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.MATERIA_DELETED,
      title: 'Materia eliminada',
      detail: `${actor.email} elimino la materia ${materia.nombre}.`,
      previousValues: { id, nombre: materia.nombre, codigo: materia.codigo },
      correlationId: req.correlationId,
    });
    return { message: `Materia con ID ${id} eliminada correctamente` };
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Archivar una materia',
    description:
      'Conserva todo el contenido de la materia y la retira de circulacion. Puede desarchivarse para volver a usarla.',
  })
  @ApiParam({ name: 'id', description: 'ID de la materia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Materia archivada exitosamente',
    type: Materia,
  })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  @ApiResponse({ status: 409, description: 'La materia ya estaba archivada' })
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Patch(':id/archivar')
  async archivar(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Materia> {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const materia = await this.materiaService.archivar(id, actor.email);

    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.MATERIA_ARCHIVED,
      title: 'Materia archivada',
      detail: `${actor.email} archivo la materia ${materia.nombre}.`,
      newValues: {
        id,
        nombre: materia.nombre,
        codigo: materia.codigo,
        archivadaEn: materia.archivadaEn,
      },
      correlationId: req.correlationId,
    });

    await this.materiaLogService.create({
      materiaId: id,
      usuarioId: actor.id,
      actorNombre: `${actor.nombre} ${actor.apellido}`.trim(),
      actorEmail: actor.email,
      action: MateriaLogAction.ARCHIVED,
      resourceType: 'materia',
      resourceId: String(id),
      title: 'Materia archivada',
      detail:
        'La materia quedo fuera de circulacion. Su contenido se conserva completo.',
    });

    return materia;
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Desarchivar una materia',
    description:
      'Devuelve la materia a estado activo con todo su contenido, alumnos e historial tal como estaban.',
  })
  @ApiParam({ name: 'id', description: 'ID de la materia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Materia desarchivada exitosamente',
    type: Materia,
  })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  @ApiResponse({ status: 409, description: 'La materia no estaba archivada' })
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Patch(':id/desarchivar')
  async desarchivar(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Materia> {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const materia = await this.materiaService.desarchivar(id);

    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.MATERIA_UNARCHIVED,
      title: 'Materia desarchivada',
      detail: `${actor.email} desarchivo la materia ${materia.nombre}.`,
      newValues: { id, nombre: materia.nombre, codigo: materia.codigo },
      correlationId: req.correlationId,
    });

    await this.materiaLogService.create({
      materiaId: id,
      usuarioId: actor.id,
      actorNombre: `${actor.nombre} ${actor.apellido}`.trim(),
      actorEmail: actor.email,
      action: MateriaLogAction.UNARCHIVED,
      resourceType: 'materia',
      resourceId: String(id),
      title: 'Materia desarchivada',
      detail: 'La materia volvio a estar disponible con todo su contenido.',
    });

    return materia;
  }

  @ApiOperation({ summary: 'Restaurar una materia eliminada' })
  @ApiParam({ name: 'id', description: 'ID de la materia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Materia restaurada exitosamente',
    type: Materia,
  })
  @ApiResponse({
    status: 404,
    description: 'Materia no encontrada',
  })
  @Roles(USER_ROLES.ADMIN)
  @Patch(':id/restore')
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Materia> {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const materia = await this.materiaService.restore(id);
    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.MATERIA_RESTORED,
      title: 'Materia restaurada',
      detail: `${actor.email} restauro la materia ${materia.nombre}.`,
      newValues: { id, nombre: materia.nombre, codigo: materia.codigo },
      correlationId: req.correlationId,
    });
    return materia;
  }
}
