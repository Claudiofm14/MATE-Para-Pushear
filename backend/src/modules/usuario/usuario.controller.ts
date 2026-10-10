import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
  Query,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from './usuario.service';
import { AlumnoMateriaService } from './alumno-materia.service';
import { ProfesorMateriaService } from './profesor-materia.service';
import {
  SolicitudInscripcionDto,
  AprobarSolicitudDto,
  RechazarSolicitudDto,
  AsignacionProfesorDto,
  SolicitarAccesoDto,
  AsignarAlumnoCursadaDto,
  AlumnosDisponiblesQueryDto,
  AlumnosExportQueryDto,
  AdminUsuariosQueryDto,
} from './dto';
import { StudentImportService } from '../gitea/student-import.service';
import {
  ColumnMapping,
  UploadedExcelFile,
} from '../gitea/student-import.types';
import { AdminAuditAction } from '../../entities/admin-audit-log.entity';
import { GiteaUserSyncService } from './gitea-user-sync.service';
import { buildStudentsCsv, buildStudentsWorkbook } from './student-export.util';

@ApiTags('Usuario')
@ApiBearerAuth()
@Controller('api')
export class UsuarioController {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly studentImportService: StudentImportService,
    private readonly giteaUserSyncService: GiteaUserSyncService,
  ) {}

  private async assertPuedeGestionarMateria(req: any, materiaId: number) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    return usuario;
  }

  private parseMapping(mapping?: string): ColumnMapping | undefined {
    if (!mapping) return undefined;
    try {
      return JSON.parse(mapping);
    } catch {
      throw new BadRequestException('El mapeo de columnas es invalido');
    }
  }

  // ==================== ENDPOINTS GENERALES ====================

  @Get('maintenance')
  @Public()
  @ApiOperation({ summary: 'Obtener estado publico de mantenimiento' })
  async obtenerMaintenanceStatus() {
    return await this.usuarioService.obtenerMaintenanceStatus();
  }

  @Get('usuario/me')
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  async obtenerUsuarioActual(@Request() req) {
    return await this.usuarioService.obtenerOCrearUsuario(req.user);
  }

  // ==================== ENDPOINTS PARA ALUMNOS ====================

  @Post('alumno/solicitar-inscripcion')
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Solicitar inscripción a una materia' })
  async solicitarInscripcion(
    @Request() req,
    @Body() dto: SolicitudInscripcionDto,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.alumnoMateriaService.solicitarInscripcion(usuario, dto);
  }

  @Get('alumno/mis-materias')
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar materias aprobadas del alumno' })
  async listarMateriasAlumno(@Request() req) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.alumnoMateriaService.listarMateriasAprobadas(usuario.id);
  }

  @Get('alumno/mis-solicitudes')
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar solicitudes pendientes del alumno' })
  async listarSolicitudesAlumno(@Request() req) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.alumnoMateriaService.listarSolicitudesPendientes(
      usuario.id,
    );
  }

  @Get('alumno/materia/:id/estado')
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Verificar estado de inscripción en una materia' })
  async verificarEstadoInscripcion(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Query('cursadaId') cursadaId?: string,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.alumnoMateriaService.obtenerEstadoInscripcion(
      usuario.id,
      materiaId,
      cursadaId ? Number(cursadaId) : undefined,
    );
  }

  // ==================== ENDPOINTS PARA PROFESORES ====================

  @Get('profesor/mis-materias')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar materias del profesor' })
  async listarMateriasProfesor(@Request() req) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.profesorMateriaService.listarMateriasPorProfesor(
      usuario.id,
    );
  }

  @Get('profesor/materia/:id/solicitudes')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar solicitudes pendientes de una materia' })
  async listarSolicitudesMateria(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    return await this.alumnoMateriaService.listarSolicitudesPorMateria(
      materiaId,
    );
  }

  @Get('profesor/materia/:id/alumnos')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar alumnos aprobados de una materia' })
  async listarAlumnosMateria(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Query('cursadaId') cursadaId?: string,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    return await this.alumnoMateriaService.listarAlumnosPorMateria(
      materiaId,
      cursadaId ? Number(cursadaId) : undefined,
    );
  }

  @Put('profesor/alumno/:id/gitea-user')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar usuario de Gitea de un alumno' })
  async actualizarGiteaUser(
    @Param('id', ParseIntPipe) alumnoId: number,
    @Body() body: { giteaUser?: string; githubUser?: string },
  ) {
    return await this.usuarioService.actualizarGithubUser(
      alumnoId,
      body.giteaUser ?? body.githubUser ?? '',
    );
  }

  @Put('profesor/alumno/:id/github-user')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Actualizar usuario del proveedor Git de un alumno',
  })
  async actualizarProviderUserCompat(
    @Param('id', ParseIntPipe) alumnoId: number,
    @Body() body: { giteaUser?: string; githubUser?: string },
  ) {
    return await this.actualizarGiteaUser(alumnoId, body);
  }

  @Get('profesor/materia/:id/cursada/:cursadaId/alumnos-disponibles')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Listar alumnos disponibles para asignar a cursada',
  })
  async listarAlumnosDisponiblesCursada(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    return await this.alumnoMateriaService.listarAlumnosDisponiblesParaCursada(
      materiaId,
      cursadaId,
    );
  }

  @Get('profesor/materia/:id/cursada/:cursadaId/alumnos-disponibles/buscar')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Buscar alumnos disponibles con paginacion y respuesta minima',
  })
  async buscarAlumnosDisponiblesCursada(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
    @Query() query: AlumnosDisponiblesQueryDto,
  ) {
    await this.assertPuedeGestionarMateria(req, materiaId);
    return this.alumnoMateriaService.buscarAlumnosDisponiblesParaCursada(
      materiaId,
      cursadaId,
      query,
    );
  }

  @Get('profesor/materia/:id/alumnos/exportar')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Exportar alumnos de una cursada a CSV o Excel' })
  async exportarAlumnosMateria(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Query() query: AlumnosExportQueryDto,
    @Res() response: Response,
  ) {
    const actor = await this.assertPuedeGestionarMateria(req, materiaId);
    const rows = await this.alumnoMateriaService.listarAlumnosParaExportar(
      materiaId,
      query.cursadaId,
      query.comisionId,
    );
    const scope = query.comisionId
      ? `comision-${query.comisionId}`
      : 'todas-las-comisiones';
    const filename = `alumnos-materia-${materiaId}-cursada-${query.cursadaId}-${scope}.${query.format}`;
    const isCsv = query.format === 'csv';
    const payload = isCsv
      ? buildStudentsCsv(rows)
      : await buildStudentsWorkbook(rows);

    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.STUDENT_LIST_EXPORTED,
      title: 'Listado de alumnos exportado',
      detail: `${actor.email} exporto ${rows.length} alumnos de la materia ${materiaId}.`,
      newValues: {
        materiaId,
        cursadaId: query.cursadaId,
        comisionId: query.comisionId || null,
        format: query.format,
        total: rows.length,
      },
      correlationId: req.correlationId,
    });

    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.type(
      isCsv
        ? 'text/csv; charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return response.send(payload);
  }

  @Post('profesor/materia/:id/sincronizar-alumnos-gitea')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Sincronizar alumnos desde Gitea' })
  async sincronizarAlumnosGitea(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
  ) {
    await this.assertPuedeGestionarMateria(req, materiaId);
    return await this.giteaUserSyncService.syncUsers();
  }

  @Post('profesor/materia/:id/asignar-alumno-cursada')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Dar acceso manual a un alumno en una cursada' })
  async asignarAlumnoACursada(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Body() dto: AsignarAlumnoCursadaDto,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    return await this.alumnoMateriaService.asignarAlumnoACursada(
      dto.alumnoId,
      materiaId,
      dto.comisionId,
    );
  }

  @Post('profesor/materia/:id/importar-alumnos/preview')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiOperation({ summary: 'Previsualizar alta masiva de alumnos en materia' })
  async previsualizarAltaAlumnosMateria(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @UploadedFile() file: UploadedExcelFile,
    @Body('mapping') mapping?: string,
  ) {
    await this.assertPuedeGestionarMateria(req, materiaId);
    return await this.studentImportService.preview(
      file,
      this.parseMapping(mapping),
    );
  }

  @Post('profesor/materia/:id/importar-alumnos/confirm')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiOperation({ summary: 'Dar de alta alumnos por Excel en una comisión' })
  async confirmarAltaAlumnosMateria(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @UploadedFile() file: UploadedExcelFile,
    @Body('comisionId') comisionId: string,
    @Body('mapping') mapping?: string,
  ) {
    await this.assertPuedeGestionarMateria(req, materiaId);

    const parsedComisionId = Number(comisionId);
    if (!parsedComisionId) {
      throw new BadRequestException('Debe seleccionar una comisión');
    }

    const parsedMapping = this.parseMapping(mapping);
    const students = await this.studentImportService.getValidStudents(
      file,
      parsedMapping || {},
    );

    if (students.length === 0) {
      throw new BadRequestException('No hay filas válidas para importar');
    }

    const result =
      await this.alumnoMateriaService.asignarAlumnosImportadosACursada(
        materiaId,
        parsedComisionId,
        students,
      );

    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.GITEA_IMPORT_EXECUTED,
      title: 'Importacion de alumnos ejecutada',
      detail: `${actor.email} importo ${students.length} alumnos en la materia ${materiaId}.`,
      newValues: {
        materiaId,
        comisionId: parsedComisionId,
        total: students.length,
        result,
      },
      correlationId: req.correlationId,
    });

    return result;
  }

  @Get('profesor/comision/:id/alumnos')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar alumnos de una comisión' })
  async listarAlumnosComision(
    @Request() req,
    @Param('id', ParseIntPipe) comisionId: number,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoComision(
        usuario.id,
        comisionId,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta comisión');
    }

    return await this.alumnoMateriaService.listarAlumnosPorComision(comisionId);
  }

  @Post('profesor/aprobar-solicitud/:id')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Aprobar solicitud de inscripción' })
  async aprobarSolicitud(
    @Request() req,
    @Param('id', ParseIntPipe) solicitudId: number,
    @Body() dto: AprobarSolicitudDto,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const solicitud =
      await this.alumnoMateriaService.obtenerInscripcion(solicitudId);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        solicitud.materia.id,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    const result = await this.alumnoMateriaService.aprobarSolicitud(
      solicitudId,
      dto.mensaje,
    );
    await this.usuarioService.registrarAdminAudit({
      actor: usuario,
      target: result.alumno,
      action: AdminAuditAction.STUDENT_ENROLLMENT_UPDATED,
      title: 'Inscripcion de alumno aprobada',
      detail: `${usuario.email} aprobo la inscripcion de ${result.alumno?.email || `usuario ${result.alumnoId}`} en materia ${result.materiaId}.`,
      newValues: {
        solicitudId,
        estado: 'aprobado',
        materiaId: result.materiaId,
      },
      correlationId: req.correlationId,
    });
    return result;
  }

  @Post('profesor/rechazar-solicitud/:id')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Rechazar solicitud de inscripción' })
  async rechazarSolicitud(
    @Request() req,
    @Param('id', ParseIntPipe) solicitudId: number,
    @Body() dto: RechazarSolicitudDto,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const solicitud =
      await this.alumnoMateriaService.obtenerInscripcion(solicitudId);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        solicitud.materia.id,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    const result = await this.alumnoMateriaService.rechazarSolicitud(
      solicitudId,
      dto.mensaje,
    );
    await this.usuarioService.registrarAdminAudit({
      actor: usuario,
      target: result.alumno,
      action: AdminAuditAction.STUDENT_ENROLLMENT_UPDATED,
      title: 'Inscripcion de alumno rechazada',
      detail: `${usuario.email} rechazo la inscripcion de ${result.alumno?.email || `usuario ${result.alumnoId}`} en materia ${result.materiaId}.`,
      newValues: {
        solicitudId,
        estado: 'rechazado',
        materiaId: result.materiaId,
      },
      correlationId: req.correlationId,
    });
    return result;
  }

  @Delete('profesor/alumno-materia/:id')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar alumno de una materia' })
  async eliminarAlumnoMateria(
    @Request() req,
    @Param('id', ParseIntPipe) inscripcionId: number,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const inscripcion =
      await this.alumnoMateriaService.obtenerInscripcion(inscripcionId);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        inscripcion.materia.id,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    await this.alumnoMateriaService.eliminarAlumnoMateria(inscripcionId);
    await this.usuarioService.registrarAdminAudit({
      actor: usuario,
      target: inscripcion.alumno,
      action: AdminAuditAction.STUDENT_ENROLLMENT_UPDATED,
      title: 'Alumno removido de materia',
      detail: `${usuario.email} removio a ${inscripcion.alumno?.email || `usuario ${inscripcion.alumnoId}`} de materia ${inscripcion.materia?.id || inscripcion.materiaId}.`,
      previousValues: {
        inscripcionId,
        alumnoId: inscripcion.alumnoId,
        materiaId: inscripcion.materia?.id || inscripcion.materiaId,
      },
      correlationId: req.correlationId,
    });
    return { message: 'Alumno eliminado exitosamente' };
  }

  @Delete('profesor/materia/:id/alumnos')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar todos los alumnos de una materia' })
  async eliminarTodosAlumnosMateria(
    @Request() req,
    @Param('id', ParseIntPipe) materiaId: number,
    @Query('cursadaId') cursadaId?: string,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        materiaId,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    await this.alumnoMateriaService.eliminarTodosAlumnosMateria(
      materiaId,
      cursadaId ? Number(cursadaId) : undefined,
    );
    return { message: 'Todos los alumnos han sido eliminados exitosamente' };
  }

  @Put('profesor/alumno-materia/:id/comision')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar comisión asignada de un alumno' })
  async actualizarComisionAlumno(
    @Request() req,
    @Param('id', ParseIntPipe) inscripcionId: number,
    @Body() body: { comisionId: number },
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const inscripcion =
      await this.alumnoMateriaService.obtenerInscripcion(inscripcionId);

    const isAdmin = usuario.rol === USER_ROLES.ADMIN;
    const tieneAcceso =
      isAdmin ||
      (await this.profesorMateriaService.verificarAccesoProfesor(
        usuario.id,
        inscripcion.materia.id,
      ));

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    return await this.alumnoMateriaService.actualizarComision(
      inscripcionId,
      body.comisionId,
    );
  }

  @Post('profesor/solicitar-acceso')
  @Roles(USER_ROLES.DOCENTE)
  @ApiOperation({ summary: 'Solicitar acceso a una materia' })
  async solicitarAccesoMateria(
    @Request() req,
    @Body() dto: SolicitarAccesoDto,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.profesorMateriaService.solicitarAcceso(usuario, dto);
  }

  // ==================== ENDPOINTS PARA ADMIN ====================

  @Post('admin/asignar-profesor')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Asignar profesor a materia y comisiones' })
  async asignarProfesor(@Body() dto: AsignacionProfesorDto) {
    return await this.profesorMateriaService.asignarProfesor(dto);
  }

  @Delete('admin/remover-profesor/:id')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Remover asignación de profesor' })
  async removerProfesor(@Param('id', ParseIntPipe) asignacionId: number) {
    await this.profesorMateriaService.removerAsignacion(asignacionId);
    return { message: 'Asignación removida exitosamente' };
  }

  @Get('admin/materia/:id/profesores')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar profesores de una materia' })
  async listarProfesoresMateria(@Param('id', ParseIntPipe) materiaId: number) {
    return await this.profesorMateriaService.listarProfesoresPorMateria(
      materiaId,
    );
  }

  @Get('admin/solicitudes-acceso')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar solicitudes de acceso pendientes' })
  async listarSolicitudesAcceso() {
    return await this.profesorMateriaService.listarSolicitudesPendientes();
  }

  @Post('admin/solicitudes-acceso/:id/aprobar')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Aprobar solicitud de acceso' })
  async aprobarSolicitudAcceso(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    await this.profesorMateriaService.aprobarSolicitudAcceso(id);
    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.USER_TEACHER_ASSIGNED,
      title: 'Solicitud docente aprobada',
      detail: `${actor.email} aprobo la solicitud docente ${id}.`,
      newValues: { solicitudId: id, estado: 'aprobado' },
      correlationId: req.correlationId,
    });
    return { message: 'Solicitud aprobada exitosamente' };
  }

  @Post('admin/solicitudes-acceso/:id/rechazar')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Rechazar solicitud de acceso' })
  async rechazarSolicitudAcceso(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    await this.profesorMateriaService.rechazarSolicitudAcceso(id);
    await this.usuarioService.registrarAdminAudit({
      actor,
      action: AdminAuditAction.USER_TEACHER_REMOVED,
      title: 'Solicitud docente rechazada',
      detail: `${actor.email} rechazo la solicitud docente ${id}.`,
      newValues: { solicitudId: id, estado: 'rechazado' },
      correlationId: req.correlationId,
    });
    return { message: 'Solicitud rechazada exitosamente' };
  }

  @Get('admin/usuarios')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar usuarios (paginado, con filtros)' })
  async listarUsuarios(@Query() query: AdminUsuariosQueryDto) {
    return await this.usuarioService.listarUsuariosAdminPaginado(query);
  }

  @Get('admin/gitea/usuarios')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar las cuentas actuales de Gitea' })
  async listarUsuariosGitea() {
    return await this.usuarioService.listarUsuariosGitea();
  }

  @Patch('admin/gitea/usuarios/:username/password')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Cambiar la contraseña de una cuenta de Gitea' })
  async actualizarPasswordGitea(
    @Request() req,
    @Param('username') username: string,
    @Body()
    body: {
      password: string;
      mustChangePassword?: boolean;
    },
  ) {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.usuarioService.actualizarPasswordGitea(
      actor,
      username,
      body?.password,
      body?.mustChangePassword !== false,
      req.correlationId,
    );
  }

  @Get('admin/metricas')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Obtener metricas rapidas administrativas' })
  async obtenerMetricasAdmin() {
    return await this.usuarioService.obtenerMetricasAdmin();
  }

  @Post('actividad/presencia')
  @ApiOperation({
    summary: 'Registrar presencia o navegación del usuario actual',
  })
  async registrarActividad(
    @Request() req,
    @Body() body: { kind?: 'page_view' | 'presence'; path?: string },
  ) {
    return await this.usuarioService.registrarActividadUsuario(
      req.usuario,
      body || {},
    );
  }

  @Get('admin/estadisticas-actividad')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Obtener estadísticas completas de actividad de usuarios',
  })
  async obtenerEstadisticasActividad() {
    return await this.usuarioService.obtenerEstadisticasActividad();
  }

  @Get('admin/estado-tecnico')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Obtener estado tecnico del campus' })
  async obtenerEstadoTecnico() {
    return await this.usuarioService.obtenerEstadoTecnico();
  }

  @Patch('admin/maintenance')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Activar o desactivar modo mantenimiento' })
  async actualizarMaintenanceStatus(
    @Request() req,
    @Body()
    body: {
      enabled: boolean;
      title?: string;
      message?: string;
      scheduledAt?: string | null;
      estimatedUntil?: string | null;
    },
  ) {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.usuarioService.actualizarMaintenanceStatus(
      actor,
      body,
      req.correlationId,
    );
  }

  @Get('admin/usuarios/:id/docencias')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar materias donde un usuario es docente' })
  async listarDocenciasUsuario(@Param('id', ParseIntPipe) usuarioId: number) {
    return await this.usuarioService.listarDocenciasUsuario(usuarioId);
  }

  @Post('admin/usuarios/:id/docencias')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Asignar una materia como docente a un usuario' })
  async asignarDocenciaUsuario(
    @Request() req,
    @Param('id', ParseIntPipe) usuarioId: number,
    @Body() body: { materiaId: number },
  ) {
    if (!body?.materiaId) {
      throw new BadRequestException('Debe indicar materiaId');
    }

    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const target = await this.usuarioService.obtenerPorId(usuarioId);
    const asignacion =
      await this.profesorMateriaService.asignarProfesorPorUsuarioId(
        usuarioId,
        Number(body.materiaId),
      );

    await this.usuarioService.registrarAdminAudit({
      actor,
      target,
      action: AdminAuditAction.USER_TEACHER_ASSIGNED,
      title: 'Docencia asignada',
      detail: `${actor.email} asigno a ${target.email} como docente de ${asignacion.materia?.nombre || `materia ${body.materiaId}`}.`,
      newValues: {
        materiaId: asignacion.materiaId,
        materiaNombre: asignacion.materia?.nombre,
      },
      correlationId: req.correlationId,
    });

    return asignacion;
  }

  @Delete('admin/usuarios/:id/docencias/:materiaId')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Quitar una materia docente a un usuario' })
  async quitarDocenciaUsuario(
    @Request() req,
    @Param('id', ParseIntPipe) usuarioId: number,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ) {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const target = await this.usuarioService.obtenerPorId(usuarioId);
    const docenciasAntes =
      await this.usuarioService.listarDocenciasUsuario(usuarioId);
    const materia = docenciasAntes.find((item) => item.materiaId === materiaId);

    await this.profesorMateriaService.removerAsignacionPorUsuarioMateria(
      usuarioId,
      materiaId,
    );

    await this.usuarioService.registrarAdminAudit({
      actor,
      target,
      action: AdminAuditAction.USER_TEACHER_REMOVED,
      title: 'Docencia removida',
      detail: `${actor.email} quito a ${target.email} como docente de ${materia?.materia?.nombre || `materia ${materiaId}`}.`,
      previousValues: {
        materiaId,
        materiaNombre: materia?.materia?.nombre,
      },
      correlationId: req.correlationId,
    });

    return { message: 'Docencia removida exitosamente' };
  }

  @Patch('admin/usuarios/:id/rol')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar rol de un usuario' })
  async actualizarRolUsuario(
    @Request() req,
    @Param('id', ParseIntPipe) usuarioId: number,
    @Body() body: { rol: string },
  ) {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.usuarioService.actualizarRolUsuario(
      actor,
      usuarioId,
      body.rol,
      req.correlationId,
    );
  }

  @Patch('admin/usuarios/:id/suspender')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Suspender un usuario' })
  async suspenderUsuario(
    @Request() req,
    @Param('id', ParseIntPipe) usuarioId: number,
    @Body() body: { motivo?: string },
  ) {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.usuarioService.suspenderUsuario(
      actor,
      usuarioId,
      body?.motivo,
      req.correlationId,
    );
  }

  @Patch('admin/usuarios/:id/reactivar')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Reactivar un usuario suspendido' })
  async reactivarUsuario(
    @Request() req,
    @Param('id', ParseIntPipe) usuarioId: number,
  ) {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.usuarioService.reactivarUsuario(
      actor,
      usuarioId,
      req.correlationId,
    );
  }

  @Delete('admin/usuarios/:id')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar un usuario de la plataforma y Gitea' })
  async eliminarUsuario(
    @Request() req,
    @Param('id', ParseIntPipe) usuarioId: number,
  ) {
    const actor = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return await this.usuarioService.eliminarUsuario(
      actor,
      usuarioId,
      req.correlationId,
    );
  }

  @Get('admin/auditoria')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar auditoria administrativa global' })
  async listarAuditoriaAdmin(@Query('limit') limit?: string) {
    return await this.usuarioService.listarAdminAuditLogs(
      limit ? Number(limit) : 100,
    );
  }
}
