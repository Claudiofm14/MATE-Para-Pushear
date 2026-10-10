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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { VideoService } from './video.service';
import { Video } from '../../entities/video.entity';
import { CreateVideoDto, UpdateVideoDto } from './dto/video.dto';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { AlumnoMateriaService } from '../usuario/alumno-materia.service';
import { SemanaService } from '../semana/semana.service';
import { Request as ExpressRequest } from 'express';
import { ForbiddenException, UseGuards, Request } from '@nestjs/common';
import { MateriaLogService } from '../materia-log/materia-log.service';
import { MateriaLogAction } from '../../entities/materia-log.entity';
import { YoutubePlaylistVideos } from './youtube-playlist.service';

@ApiTags('Video')
@Controller('video')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly alumnoMateriaService: AlumnoMateriaService,
    private readonly semanaService: SemanaService,
    private readonly materiaLogService: MateriaLogService,
  ) {}

  private getActor(user: any) {
    return {
      usuarioId: user.id,
      actorNombre: `${user.nombre} ${user.apellido}`.trim(),
      actorEmail: user.email,
    };
  }

  private getMateriaId(video: Video): number {
    return video.materia?.id || video.semana?.cursada?.materia?.id;
  }

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

  private async assertCanReadSemana(req: any, semanaId: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const roles = req.user.realm_access?.roles || [];
    if (roles.includes(USER_ROLES.ADMIN)) return;

    const semana = await this.semanaService.findOne(semanaId);
    const isProfesor =
      await this.profesorMateriaService.verificarAccesoProfesor(
        user.id,
        semana.cursada.materia.id,
      );
    if (isProfesor) return;

    const comisionIds = semana.comisiones?.map((comision) => comision.id) || [];
    const canRead = await Promise.all(
      comisionIds.map(async (comisionId) => {
        const hasAccess =
          await this.alumnoMateriaService.verificarAccesoAlumnoCursada(
            user.id,
            semana.cursada.id,
            comisionId,
          );
        if (!hasAccess) return false;

        const visibles = await this.semanaService.findVisiblesParaAlumno(
          semana.cursada.id,
          comisionId,
        );
        return visibles.some((visible) => visible.id === semana.id);
      }),
    );

    if (!canRead.some(Boolean)) {
      throw new ForbiddenException('No tienes acceso a esta semana');
    }
  }

  @ApiOperation({ summary: 'Obtener todos los videos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los videos',
    type: [Video],
  })
  @Roles(USER_ROLES.ADMIN)
  @Get()
  async findAll(): Promise<Video[]> {
    return this.videoService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un video por ID' })
  @ApiParam({ name: 'id', description: 'ID del video', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Video encontrado',
    type: Video,
  })
  @ApiResponse({
    status: 404,
    description: 'Video no encontrado',
  })
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Video> {
    const video = await this.videoService.findOne(id);
    if (video.semana?.id) {
      await this.assertCanReadSemana(req, video.semana.id);
    } else {
      await this.assertCanReadMateria(req, this.getMateriaId(video));
    }
    return video;
  }

  @ApiOperation({ summary: 'Obtener los videos de una playlist de YouTube' })
  @ApiParam({
    name: 'id',
    description: 'ID de la playlist guardada',
    type: 'number',
  })
  @Get(':id/playlist')
  async getPlaylistVideos(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<YoutubePlaylistVideos> {
    // Aplicar el mismo control de materia y visibilidad que al recurso original.
    const video = await this.findOne(req, id);
    return this.videoService.getPlaylistVideos(video);
  }

  @ApiOperation({ summary: 'Obtener videos por semana' })
  @ApiParam({
    name: 'semanaId',
    description: 'ID de la semana',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de videos de la semana',
    type: [Video],
  })
  @Get('semana/:semanaId')
  async findBySemana(
    @Request() req,
    @Param('semanaId', ParseIntPipe) semanaId: number,
  ): Promise<Video[]> {
    await this.assertCanReadSemana(req, semanaId);
    return this.videoService.findBySemana(semanaId);
  }

  @ApiOperation({ summary: 'Obtener videos por materia' })
  @ApiParam({
    name: 'materiaId',
    description: 'ID de la materia',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de videos de la materia',
    type: [Video],
  })
  @Get('materia/:materiaId')
  async findByMateria(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ): Promise<Video[]> {
    await this.assertCanReadMateria(req, materiaId);
    return this.videoService.findByMateria(materiaId);
  }

  @ApiOperation({ summary: 'Crear un nuevo video' })
  @ApiBody({ type: CreateVideoDto })
  @ApiResponse({
    status: 201,
    description: 'Video creado exitosamente',
    type: Video,
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
    @Body() createVideoDto: CreateVideoDto,
  ): Promise<Video> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      let materiaId: number;

      if (createVideoDto.semanaId) {
        const semana = await this.semanaService.findOne(
          createVideoDto.semanaId,
        );
        materiaId = semana.cursada.materia.id;
      } else if (createVideoDto.materiaId) {
        materiaId = createVideoDto.materiaId;
      } else {
        throw new ForbiddenException(
          'Debe especificar una semana o una materia',
        );
      }

      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const video = await this.videoService.create(createVideoDto);
    const fullVideo = await this.videoService.findOne(video.id);
    await this.materiaLogService.create({
      materiaId: this.getMateriaId(fullVideo),
      ...this.getActor(user),
      action: MateriaLogAction.CREATED,
      resourceType: 'video',
      resourceId: String(fullVideo.id),
      title: 'Video creado',
      detail: `Se creó el video "${fullVideo.titulo}".`,
      metadata: createVideoDto,
    });
    return video;
  }

  @ApiOperation({ summary: 'Actualizar un video' })
  @ApiParam({ name: 'id', description: 'ID del video', type: 'number' })
  @ApiBody({ type: UpdateVideoDto })
  @ApiResponse({
    status: 200,
    description: 'Video actualizado exitosamente',
    type: Video,
  })
  @ApiResponse({
    status: 404,
    description: 'Video no encontrado',
  })
  @Put(':id')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVideoDto: UpdateVideoDto,
  ): Promise<Video> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const video = await this.videoService.findOne(id);
      let materiaId: number;

      if (video.semana) {
        materiaId = video.semana.cursada.materia.id;
      } else if (video.materia) {
        materiaId = video.materia.id;
      } else {
        // Should not happen if data is consistent
        throw new ForbiddenException('Video sin asociación a materia');
      }

      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const video = await this.videoService.update(id, updateVideoDto);
    const fullVideo = await this.videoService.findOne(video.id);
    await this.materiaLogService.create({
      materiaId: this.getMateriaId(fullVideo),
      ...this.getActor(user),
      action: MateriaLogAction.UPDATED,
      resourceType: 'video',
      resourceId: String(fullVideo.id),
      title: 'Video actualizado',
      detail: `Se actualizó el video "${fullVideo.titulo}".`,
      metadata: updateVideoDto,
    });
    return video;
  }

  @ApiOperation({ summary: 'Eliminar un video (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del video', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Video eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Video no encontrado',
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
      const video = await this.videoService.findOne(id);
      let materiaId: number;

      if (video.semana) {
        materiaId = video.semana.cursada.materia.id;
      } else if (video.materia) {
        materiaId = video.materia.id;
      } else {
        throw new ForbiddenException('Video sin asociación a materia');
      }

      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const video = await this.videoService.findOne(id);
    await this.videoService.remove(id);
    await this.materiaLogService.create({
      materiaId: this.getMateriaId(video),
      ...this.getActor(user),
      action: MateriaLogAction.DELETED,
      resourceType: 'video',
      resourceId: String(video.id),
      title: 'Video eliminado',
      detail: `Se eliminó el video "${video.titulo}".`,
    });
  }

  @ApiOperation({ summary: 'Restaurar un video eliminado' })
  @ApiParam({ name: 'id', description: 'ID del video', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Video restaurado exitosamente',
    type: Video,
  })
  @ApiResponse({
    status: 404,
    description: 'Video no encontrado',
  })
  @Patch(':id/restore')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async restore(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Video> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const video = await this.videoService.findOne(id);
      let materiaId: number;

      if (video.semana) {
        materiaId = video.semana.cursada.materia.id;
      } else if (video.materia) {
        materiaId = video.materia.id;
      } else {
        throw new ForbiddenException('Video sin asociación a materia');
      }

      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    const video = await this.videoService.restore(id);
    const fullVideo = await this.videoService.findOne(video.id);
    await this.materiaLogService.create({
      materiaId: this.getMateriaId(fullVideo),
      ...this.getActor(user),
      action: MateriaLogAction.RESTORED,
      resourceType: 'video',
      resourceId: String(fullVideo.id),
      title: 'Video restaurado',
      detail: `Se restauró el video "${fullVideo.titulo}".`,
    });
    return video;
  }
}
