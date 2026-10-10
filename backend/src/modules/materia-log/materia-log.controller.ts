import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MateriaLog } from '../../entities/materia-log.entity';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { MateriaLogService } from './materia-log.service';
import { ListMateriaLogQueryDto } from './dto/materia-log.dto';

@ApiTags('Materia Logs')
@Controller('materia/:materiaId/logs')
@UseGuards(CustomRoleGuard)
@Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
export class MateriaLogController {
  constructor(
    private readonly materiaLogService: MateriaLogService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
  ) {}

  @ApiOperation({ summary: 'Listar logs de una materia' })
  @ApiParam({ name: 'materiaId', description: 'ID de la materia' })
  @ApiResponse({ status: 200, type: [MateriaLog] })
  @Get()
  async findByMateria(
    @Request() req,
    @Param('materiaId', ParseIntPipe) materiaId: number,
    @Query() query: ListMateriaLogQueryDto,
  ): Promise<MateriaLog[]> {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const userRoles = req.user.realm_access?.roles || [];

    if (!userRoles.includes(USER_ROLES.ADMIN)) {
      const tieneAcceso =
        await this.profesorMateriaService.verificarAccesoProfesor(
          user.id,
          materiaId,
        );
      if (!tieneAcceso) {
        throw new ForbiddenException('No tienes acceso a los logs');
      }
    }

    return this.materiaLogService.findByMateria(materiaId, query);
  }
}
