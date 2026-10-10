import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MaterialAcademicoService } from './material-academico.service';
import {
  CreateMaterialAcademicoDto,
  UpdateMaterialAcademicoDto,
} from './dto/material-academico.dto';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
import { Request as ExpressRequest } from 'express';
import { ForbiddenException, Request } from '@nestjs/common';
import { MateriaLogService } from '../materia-log/materia-log.service';
import { MateriaLogAction } from '../../entities/materia-log.entity';

@Controller('material-academico')
export class MaterialAcademicoController {
  constructor(
    private readonly materialService: MaterialAcademicoService,
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
    const userRoles = req.user.realm_access?.roles || [];

    if (userRoles.includes(USER_ROLES.ADMIN)) return user;

    const tieneAccesoProfesor =
      await this.profesorMateriaService.verificarAccesoProfesor(
        user.id,
        materiaId,
      );
    if (tieneAccesoProfesor) return user;

    const tieneAccesoAlumno =
      await this.alumnoMateriaService.verificarAccesoAlumno(user.id, materiaId);
    if (!tieneAccesoAlumno) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    return user;
  }

  private async getReadableMateriaIds(req: any): Promise<number[] | null> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (userRoles.includes(USER_ROLES.ADMIN)) return null;

    const materiasProfesor =
      await this.profesorMateriaService.listarMateriasPorProfesor(user.id);
    const materiasAlumno =
      await this.alumnoMateriaService.listarMateriasAprobadas(user.id);

    return Array.from(
      new Set([
        ...materiasProfesor.map((item: any) => item.materia?.id),
        ...materiasAlumno.map((item: any) => item.materia?.id),
      ]),
    ).filter(Boolean);
  }

  @Get()
  async findAll(@Request() req) {
    const materiaIds = await this.getReadableMateriaIds(req);
    if (materiaIds !== null) {
      return await this.materialService.findByMaterias(materiaIds);
    }
    return await this.materialService.findAll();
  }

  @Get('materia/:materiaId')
  async findByMateria(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ) {
    await this.assertCanReadMateria(req, materiaId);
    return await this.materialService.findByMateria(materiaId);
  }

  @Get('categoria/:categoria')
  async findByCategoria(@Request() req, @Param('categoria') categoria: string) {
    const materiaIds = await this.getReadableMateriaIds(req);
    const materiales = await this.materialService.findByCategoria(categoria);
    if (materiaIds === null) return materiales;
    return materiales.filter((material) =>
      materiaIds.includes(material.materiaId),
    );
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const material = await this.materialService.findOne(id);
    await this.assertCanReadMateria(req, material.materiaId);
    return material;
  }

  @Post()
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async create(@Request() req, @Body() createDto: CreateMaterialAcademicoDto) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          createDto.materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const material = await this.materialService.create(createDto);
    await this.materiaLogService.create({
      materiaId: material.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.CREATED,
      resourceType: 'material',
      resourceId: String(material.id),
      title: 'Material creado',
      detail: `Se creó el material "${material.titulo}".`,
      metadata: createDto,
    });
    return material;
  }

  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMaterialAcademicoDto,
  ) {
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

    const material = await this.materialService.update(id, updateDto);
    await this.materiaLogService.create({
      materiaId: material.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.UPDATED,
      resourceType: 'material',
      resourceId: String(material.id),
      title: 'Material actualizado',
      detail: `Se actualizó el material "${material.titulo}".`,
      metadata: updateDto,
    });
    return material;
  }

  @Delete(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
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

    const material = await this.materialService.findOne(id);
    await this.materialService.remove(id);
    await this.materiaLogService.create({
      materiaId: material.materiaId,
      ...this.getActor(user),
      action: MateriaLogAction.DELETED,
      resourceType: 'material',
      resourceId: String(material.id),
      title: 'Material eliminado',
      detail: `Se eliminó el material "${material.titulo}".`,
    });
    return { message: 'Material académico eliminado exitosamente' };
  }

  @Put('reorder/batch')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async reorder(
    @Request() req,
    @Body() items: { id: number; orden: number }[],
  ) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      // Verificar acceso para cada item (podría ser costoso, pero seguro)
      // O verificar el primero asumiendo que todos son de la misma materia (riesgoso)
      // Mejor: Verificar que todos pertenezcan a materias donde el profe tiene acceso.
      // Dado que esto es batch, iteramos.
      for (const item of items) {
        const material = await this.materialService.findOne(item.id);
        const tieneAcceso =
          await this.profesorMateriaService.verificarAccesoProfesor(
            user.id,
            material.materia.id,
          );
        if (!tieneAcceso) {
          throw new ForbiddenException(
            `No tienes acceso a la materia del material ${item.id}`,
          );
        }
      }
    }

    await this.materialService.reorder(items);
    if (items.length > 0) {
      const material = await this.materialService.findOne(items[0].id);
      await this.materiaLogService.create({
        materiaId: material.materiaId,
        ...this.getActor(user),
        action: MateriaLogAction.UPDATED,
        resourceType: 'material',
        resourceId: 'batch',
        title: 'Materiales reordenados',
        detail: 'Se actualizó el orden de los materiales académicos.',
        metadata: { items },
      });
    }
    return { message: 'Orden actualizado exitosamente' };
  }
}
