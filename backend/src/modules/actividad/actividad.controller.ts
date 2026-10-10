import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  ParseIntPipe,
  ForbiddenException,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { ActividadService } from './actividad.service';
import { EntregaActividadService } from './entrega-actividad.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { UsuarioService } from '../usuario/usuario.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
import {
  CreateActividadDto,
  UpdateActividadDto,
  UpdateEntregaDto,
  BulkUpdateEntregaDto,
} from './dto';
import { AdminAuditAction } from '../../entities/admin-audit-log.entity';

@ApiTags('Actividad')
@ApiBearerAuth()
@Controller('api')
export class ActividadController {
  constructor(
    private readonly actividadService: ActividadService,
    private readonly entregaService: EntregaActividadService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly usuarioService: UsuarioService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
  ) {}

  @Post('actividad')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Crear nueva actividad (solo docentes)' })
  async crear(@Request() req, @Body() dto: CreateActividadDto) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    // Verificar que el docente tiene acceso a la materia
    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          usuario.id,
          dto.materiaId,
        );

      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    return await this.actividadService.crear(dto);
  }

  @Get('materia/:id/actividades')
  @ApiOperation({ summary: 'Listar actividades de una materia' })
  async listarPorMateria(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];
    const tieneAcceso =
      userRoles.includes(USER_ROLES.ADMIN) ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      )) ||
      (await this.alumnoMateriaService.verificarAccesoAlumno(
        usuario.id,
        materiaId,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    return await this.actividadService.listarPorMateria(materiaId);
  }

  @Put('actividad/:id')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar actividad (solo docentes)' })
  async actualizar(
    @Request() req,
    @Param('id', ParseIntPipe) actividadId: number,
    @Body() dto: UpdateActividadDto,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const actividad = await this.actividadService.obtenerPorId(actividadId);
    const userRoles = req.user.realm_access?.roles || [];

    // Verificar acceso del docente a la materia
    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          usuario.id,
          actividad.materiaId,
        );

      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    return await this.actividadService.actualizar(actividadId, dto);
  }

  @Delete('actividad/:id')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar actividad (solo docentes)' })
  async eliminar(
    @Request() req,
    @Param('id', ParseIntPipe) actividadId: number,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const actividad = await this.actividadService.obtenerPorId(actividadId);
    const userRoles = req.user.realm_access?.roles || [];

    // Verificar acceso del docente a la materia
    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          usuario.id,
          actividad.materiaId,
        );

      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    await this.actividadService.eliminar(actividadId);
    return { message: 'Actividad eliminada exitosamente' };
  }

  @Get('materia/:id/planilla-seguimiento')
  @ApiOperation({ summary: 'Obtener planilla de seguimiento completa' })
  async obtenerPlanilla(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Query('cursadaId') cursadaId?: string,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);

    // Si es alumno, solo puede ver sus propias calificaciones
    // Si es docente, puede ver toda la planilla si tiene acceso
    const userRoles = req.user.realm_access?.roles || [];
    const isAdmin = userRoles.includes(USER_ROLES.ADMIN);
    const isAlumno = userRoles.includes(USER_ROLES.ALUMNO);
    const tieneAccesoProfesor =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      ));

    if (!isAlumno && !tieneAccesoProfesor) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    const cursadaIdNumber = cursadaId ? Number(cursadaId) : undefined;

    if (isAlumno && !tieneAccesoProfesor) {
      if (!cursadaIdNumber) {
        throw new ForbiddenException('No tienes acceso a esta cursada');
      }

      const tieneAccesoAlumno =
        await this.alumnoMateriaService.verificarAccesoAlumnoCursada(
          usuario.id,
          cursadaIdNumber,
        );
      const tieneAccesoMateria =
        await this.alumnoMateriaService.verificarAccesoAlumno(
          usuario.id,
          materiaId,
        );

      if (!tieneAccesoAlumno || !tieneAccesoMateria) {
        throw new ForbiddenException('No tienes acceso a esta cursada');
      }
    }

    return this.entregaService.obtenerPlanillaPorMateria(
      materiaId,
      cursadaIdNumber,
      isAlumno && !tieneAccesoProfesor ? usuario.id : undefined,
    );
  }

  @Get('materia/:id/planilla-seguimiento/export')
  @ApiOperation({ summary: 'Exportar planilla de seguimiento en CSV' })
  async exportarPlanilla(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Res() res: Response,
    @Query('cursadaId') cursadaId?: string,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];
    const isAdmin = userRoles.includes(USER_ROLES.ADMIN);
    const tieneAccesoProfesor =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      ));

    if (!tieneAccesoProfesor) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    const csv = await this.entregaService.exportarPlanillaCsv(
      materiaId,
      cursadaId ? Number(cursadaId) : undefined,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="planilla-materia-${materiaId}.csv"`,
    );
    res.send(`\uFEFF${csv}`);
  }

  @Get('materia/:id/alumno/:alumnoId/historial')
  @ApiOperation({ summary: 'Obtener historial individual de un alumno' })
  async obtenerHistorialAlumno(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Param('alumnoId', ParseIntPipe) alumnoId: number,
    @Query('cursadaId') cursadaId?: string,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];
    const isAdmin = userRoles.includes(USER_ROLES.ADMIN);
    const tieneAccesoProfesor =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      ));

    if (!tieneAccesoProfesor && usuario.id !== alumnoId) {
      throw new ForbiddenException('No tienes acceso a este historial');
    }

    return this.entregaService.obtenerHistorialAlumno(
      materiaId,
      alumnoId,
      cursadaId ? Number(cursadaId) : undefined,
    );
  }

  @Put('entrega-actividad/:actividadId/:alumnoId')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar entrega de un alumno (solo docentes)' })
  async actualizarEntrega(
    @Request() req,
    @Param('actividadId', ParseIntPipe) actividadId: number,
    @Param('alumnoId', ParseIntPipe) alumnoId: number,
    @Body() dto: UpdateEntregaDto,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const actividad = await this.actividadService.obtenerPorId(actividadId);
    const userRoles = req.user.realm_access?.roles || [];

    // Verificar acceso del docente a la materia
    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          usuario.id,
          actividad.materiaId,
        );

      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const entrega = await this.entregaService.actualizarEntrega(
      actividadId,
      alumnoId,
      dto,
    );
    const alumno = await this.usuarioService.obtenerPorId(alumnoId);
    await this.usuarioService.registrarAdminAudit({
      actor: usuario,
      target: alumno,
      action: AdminAuditAction.DELIVERY_UPDATED,
      title: 'Entrega actualizada',
      detail: `${usuario.email} actualizo una entrega de ${alumno.email} en materia ${actividad.materiaId}.`,
      newValues: {
        actividadId,
        alumnoId,
        materiaId: actividad.materiaId,
        entregaId: entrega.id,
        entrega: dto,
      },
      correlationId: req.correlationId,
    });
    return entrega;
  }

  @Put('entrega-actividad/bulk')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar múltiples entregas (solo docentes)' })
  async actualizarMultiples(
    @Request() req,
    @Body() entregas: BulkUpdateEntregaDto[],
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    // Verificar que el docente tiene acceso a todas las actividades
    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const actividades = await this.actividadService.obtenerPorIds(
        entregas.map((item) => item.actividadId),
      );
      const actividadesPorId = new Map(
        actividades.map((actividad) => [actividad.id, actividad]),
      );

      for (const item of entregas) {
        const actividad = actividadesPorId.get(item.actividadId);
        if (!actividad) {
          throw new ForbiddenException(
            `No tienes acceso a la actividad ${item.actividadId}`,
          );
        }
        const tieneAcceso =
          await this.profesorMateriaService.verificarAccesoProfesor(
            usuario.id,
            actividad.materiaId,
          );

        if (!tieneAcceso) {
          throw new ForbiddenException(
            `No tienes acceso a la actividad ${item.actividadId}`,
          );
        }
      }
    }

    await this.entregaService.actualizarMultiples(
      entregas.map((e) => ({
        actividadId: e.actividadId,
        alumnoId: e.alumnoId,
        datos: e.entrega,
      })),
    );

    await this.usuarioService.registrarAdminAudit({
      actor: usuario,
      action: AdminAuditAction.DELIVERY_UPDATED,
      title: 'Entregas actualizadas en lote',
      detail: `${usuario.email} actualizo ${entregas.length} entregas desde la planilla.`,
      newValues: {
        total: entregas.length,
        actividades: Array.from(
          new Set(entregas.map((item) => item.actividadId)),
        ),
      },
      correlationId: req.correlationId,
    });

    return { message: 'Entregas actualizadas exitosamente' };
  }
}
