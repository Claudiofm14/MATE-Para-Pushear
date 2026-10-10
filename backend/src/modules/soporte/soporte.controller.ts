import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SoporteService, ImagenSubida } from './soporte.service';
import {
  CrearReporteDto,
  ListarReportesDto,
  ResponderReporteDto,
} from './dto/soporte.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { UsuarioService } from '../usuario/usuario.service';

const LIMITE_ADJUNTO = { limits: { fileSize: 5 * 1024 * 1024, files: 1 } };

@ApiTags('Soporte')
@ApiBearerAuth()
@Controller('api/soporte')
export class SoporteController {
  constructor(
    private readonly soporteService: SoporteService,
    private readonly usuarioService: UsuarioService,
  ) {}

  private esAdmin(req: any): boolean {
    const roles = req.user?.realm_access?.roles || [];
    return roles.includes(USER_ROLES.ADMIN);
  }

  // --- Usuario ----------------------------------------------------------

  @ApiOperation({
    summary: 'Obtener el hilo de soporte propio',
    description:
      'Devuelve el reporte abierto del usuario, o uno recien cerrado que todavia no vio. null si no tiene ninguno.',
  })
  @Get('mi-reporte')
  async miReporte(@Request() req) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return this.soporteService.obtenerHiloDeUsuario(usuario.id);
  }

  @ApiOperation({
    summary: 'Resumen liviano para el boton flotante',
    description:
      'Pensado para consultarse periodicamente: indica si hay hilo y cuantos mensajes sin leer.',
  })
  @Get('mi-resumen')
  async miResumen(@Request() req) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return this.soporteService.obtenerResumenDeUsuario(usuario.id);
  }

  @ApiOperation({ summary: 'Abrir un reporte de soporte' })
  @ApiResponse({ status: 201, description: 'Reporte creado' })
  @ApiResponse({ status: 409, description: 'Ya hay un reporte en curso' })
  @Post()
  @UseInterceptors(FileInterceptor('imagen', LIMITE_ADJUNTO))
  async crear(
    @Request() req,
    @Body() dto: CrearReporteDto,
    @UploadedFile() imagen?: ImagenSubida,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return this.soporteService.crear(
      usuario,
      dto,
      imagen,
      req.headers?.['user-agent'],
    );
  }

  @ApiOperation({ summary: 'Responder en el hilo propio' })
  @Post('mi-reporte/mensajes')
  @UseInterceptors(FileInterceptor('imagen', LIMITE_ADJUNTO))
  async responder(
    @Request() req,
    @Body() dto: ResponderReporteDto,
    @UploadedFile() imagen?: ImagenSubida,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return this.soporteService.responderComoUsuario(
      usuario,
      dto.mensaje,
      imagen,
    );
  }

  @ApiOperation({
    summary: 'Marcar el hilo propio como leido',
    description:
      'Si el reporte estaba cerrado, con esto desaparece del widget y el usuario puede abrir uno nuevo.',
  })
  @Patch('mi-reporte/leido')
  async marcarLeido(@Request() req) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    await this.soporteService.marcarLeidoPorUsuario(usuario.id);
    return { message: 'Hilo marcado como leido' };
  }

  // --- Adjuntos ---------------------------------------------------------

  @ApiOperation({ summary: 'Descargar una imagen adjunta' })
  @ApiParam({ name: 'id', description: 'ID del adjunto', type: 'number' })
  @Get('adjunto/:id')
  async adjunto(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const adjunto = await this.soporteService.obtenerAdjunto(
      id,
      usuario,
      this.esAdmin(req),
    );

    res.setHeader('Content-Type', adjunto.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${adjunto.nombre}"`,
    );
    res.send(adjunto.contenido);
  }

  // --- Admin ------------------------------------------------------------

  @ApiOperation({ summary: 'Listar reportes (solo admin)' })
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Get()
  async listar(@Query() filtros: ListarReportesDto) {
    return this.soporteService.listarParaAdmin(filtros);
  }

  @ApiOperation({ summary: 'Ver un reporte completo (solo admin)' })
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Get(':id')
  async detalle(@Param('id', ParseIntPipe) id: number) {
    return this.soporteService.obtenerParaAdmin(id);
  }

  @ApiOperation({ summary: 'Responder un reporte (solo admin)' })
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Post(':id/mensajes')
  @UseInterceptors(FileInterceptor('imagen', LIMITE_ADJUNTO))
  async responderAdmin(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResponderReporteDto,
    @UploadedFile() imagen?: ImagenSubida,
  ) {
    const admin = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return this.soporteService.responderComoAdmin(
      id,
      admin,
      dto.mensaje,
      imagen,
    );
  }

  @ApiOperation({
    summary: 'Cerrar un reporte (solo admin)',
    description: 'Al cerrarlo el usuario deja de ver el hilo en su widget.',
  })
  @ApiResponse({ status: 409, description: 'El reporte ya estaba cerrado' })
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Patch(':id/cerrar')
  async cerrar(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const admin = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return this.soporteService.cerrar(id, admin);
  }

  @ApiOperation({ summary: 'Reabrir un reporte cerrado (solo admin)' })
  @ApiResponse({ status: 409, description: 'El reporte ya estaba abierto' })
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Patch(':id/reabrir')
  async reabrir(@Param('id', ParseIntPipe) id: number) {
    return this.soporteService.reabrir(id);
  }

  @ApiOperation({ summary: 'Marcar un reporte como leido (solo admin)' })
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.ADMIN)
  @Patch(':id/leido')
  async marcarLeidoAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.soporteService.marcarLeidoPorAdmin(id);
    return { message: 'Reporte marcado como leido' };
  }
}
