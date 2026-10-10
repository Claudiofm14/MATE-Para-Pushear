import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { TrashItem, TrashService } from './trash.service';

@ApiTags('Papelera')
@ApiBearerAuth()
@Controller('api/materia/:materiaId/papelera')
export class TrashController {
  constructor(
    private readonly trashService: TrashService,
    private readonly profesorMateriaService: ProfesorMateriaService,
  ) {}

  private async assertCanManage(req: any, materiaId: number) {
    const roles = req.user.realm_access?.roles || [];
    if (roles.includes(USER_ROLES.ADMIN)) return;

    const userId = req.usuario?.id;
    const tieneAcceso =
      await this.profesorMateriaService.verificarAccesoProfesor(
        userId,
        materiaId,
      );

    if (!tieneAcceso) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar elementos eliminados de una materia' })
  async list(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ) {
    await this.assertCanManage(req, materiaId);
    return this.trashService.listByMateria(materiaId);
  }

  @Patch(':type/:id/restore')
  @ApiOperation({ summary: 'Restaurar un elemento eliminado' })
  async restore(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
    @Param('type') type: TrashItem['type'],
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.assertCanManage(req, materiaId);
    return this.trashService.restore(type, id);
  }
}
