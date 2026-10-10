import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { GiteaStatusService } from './gitea-status.service';

@ApiTags('Gitea Status')
@ApiBearerAuth()
@Controller('api/materia/:materiaId/gitea-status')
export class GiteaStatusController {
  constructor(
    private readonly service: GiteaStatusService,
    private readonly profesorMateriaService: ProfesorMateriaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar estado de repositorios Gitea por materia' })
  async list(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ) {
    const roles = req.user.realm_access?.roles || [];
    if (!roles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          req.usuario.id,
          materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    return this.service.listByMateria(materiaId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sincronizar estado de repositorios Gitea' })
  async sync(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ) {
    const roles = req.user.realm_access?.roles || [];
    if (!roles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          req.usuario.id,
          materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a esta materia');
      }
    }

    return this.service.syncByMateria(materiaId);
  }
}
