import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CustomRoleGuard } from '../../auth/guards/custom-role.guard';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { MateriaLogAction } from '../../entities/materia-log.entity';
import { MateriaLogService } from '../materia-log/materia-log.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { UsuarioService } from '../usuario/usuario.service';
import {
  CreateCronogramaFilaDto,
  CronogramaQueryDto,
  UpdateCronogramaFilaDto,
} from './dto/cronograma.dto';
import { CronogramaService } from './cronograma.service';

@ApiTags('Cronograma')
@Controller('cronograma')
export class CronogramaController {
  constructor(
    private readonly service: CronogramaService,
    private readonly usuarioService: UsuarioService,
    private readonly profesorMateriaService: ProfesorMateriaService,
    private readonly logService: MateriaLogService,
    @InjectRepository(AlumnoMateria)
    private readonly inscripcionRepository: Repository<AlumnoMateria>,
  ) {}

  private roles(req: any): string[] {
    return req.user.realm_access?.roles || [];
  }

  private actor(user: any) {
    return {
      usuarioId: user.id,
      actorNombre: `${user.nombre} ${user.apellido}`.trim(),
      actorEmail: user.email,
    };
  }

  private async assertWrite(req: any, materiaId: number) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    if (this.roles(req).includes(USER_ROLES.ADMIN)) return user;
    if (
      !this.roles(req).includes(USER_ROLES.DOCENTE) ||
      !(await this.profesorMateriaService.verificarAccesoProfesor(
        user.id,
        materiaId,
      ))
    ) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este cronograma',
      );
    }
    return user;
  }

  private async resolveReadCommission(
    req: any,
    cursadaId: number,
    requested?: number,
  ) {
    const user = await this.usuarioService.obtenerOCrearUsuario(req.user);
    const roles = this.roles(req);
    if (roles.includes(USER_ROLES.ADMIN))
      return { user, comisionId: requested };
    const cursada = await this.service.getCursada(cursadaId);
    if (
      roles.includes(USER_ROLES.DOCENTE) &&
      (await this.profesorMateriaService.verificarAccesoProfesor(
        user.id,
        cursada.materia.id,
      ))
    ) {
      return { user, comisionId: requested };
    }
    const inscripcion = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .innerJoinAndSelect('inscripcion.comision', 'comision')
      .innerJoin('comision.cursada', 'cursada')
      .where('inscripcion.alumnoId = :alumnoId', { alumnoId: user.id })
      .andWhere('inscripcion.estado = :estado', { estado: 'aprobado' })
      .andWhere('cursada.id = :cursadaId', { cursadaId })
      .getOne();
    if (!inscripcion)
      throw new ForbiddenException('No tienes acceso a esta cursada');
    return { user, comisionId: inscripcion.comisionId };
  }

  @Get('cursada/:cursadaId')
  @ApiOperation({ summary: 'Listar el cronograma de una cursada' })
  @ApiParam({ name: 'cursadaId', type: Number })
  async findByCursada(
    @Request() req,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
    @Query() query: CronogramaQueryDto,
  ) {
    const access = await this.resolveReadCommission(
      req,
      cursadaId,
      query.comisionId,
    );
    return this.service.findByCursada(cursadaId, access.comisionId);
  }

  @Get('filas/:filaId')
  @ApiOperation({ summary: 'Obtener una fila del cronograma' })
  async findOne(@Request() req, @Param('filaId', ParseIntPipe) filaId: number) {
    const fila = await this.service.findOne(filaId);
    const access = await this.resolveReadCommission(req, fila.cursadaId);
    if (access.comisionId) {
      const propia = fila.comisiones.find(
        (item) => item.comisionId === access.comisionId,
      );
      if (!propia)
        throw new ForbiddenException('La fila no corresponde a tu comisión');
      return { ...fila, comisiones: [propia] };
    }
    return fila;
  }

  @Post('cursada/:cursadaId/filas')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Agregar una fila al cronograma' })
  async create(
    @Request() req,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
    @Body() dto: CreateCronogramaFilaDto,
  ) {
    const cursada = await this.service.getCursada(cursadaId);
    const user = await this.assertWrite(req, cursada.materia.id);
    const fila = await this.service.create(cursadaId, dto);
    await this.logService.create({
      materiaId: cursada.materia.id,
      ...this.actor(user),
      action: MateriaLogAction.CREATED,
      resourceType: 'cronograma_fila',
      resourceId: String(fila.id),
      title: 'Fila del cronograma creada',
      detail: `Se agregó la semana ${fila.numeroSemana} del ${fila.fecha}.`,
      metadata: dto,
    });
    return fila;
  }

  @Put('filas/:filaId')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Editar una fila del cronograma' })
  async update(
    @Request() req,
    @Param('filaId', ParseIntPipe) filaId: number,
    @Body() dto: UpdateCronogramaFilaDto,
  ) {
    const previous = await this.service.findOne(filaId);
    const user = await this.assertWrite(req, previous.cursada.materia.id);
    const fila = await this.service.update(filaId, dto);
    await this.logService.create({
      materiaId: previous.cursada.materia.id,
      ...this.actor(user),
      action: MateriaLogAction.UPDATED,
      resourceType: 'cronograma_fila',
      resourceId: String(fila.id),
      title: 'Fila del cronograma actualizada',
      detail: `Se actualizó la semana ${fila.numeroSemana} del ${fila.fecha}.`,
      previousValues: previous,
      newValues: fila,
    });
    return fila;
  }

  @Delete('filas/:filaId')
  @UseGuards(CustomRoleGuard)
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar una fila del cronograma' })
  async remove(@Request() req, @Param('filaId', ParseIntPipe) filaId: number) {
    const previous = await this.service.findOne(filaId);
    const user = await this.assertWrite(req, previous.cursada.materia.id);
    const fila = await this.service.remove(filaId);
    await this.logService.create({
      materiaId: previous.cursada.materia.id,
      ...this.actor(user),
      action: MateriaLogAction.DELETED,
      resourceType: 'cronograma_fila',
      resourceId: String(fila.id),
      title: 'Fila del cronograma eliminada',
      detail: `Se eliminó la semana ${fila.numeroSemana} del ${fila.fecha}.`,
      previousValues: previous,
    });
    return { message: 'Fila del cronograma eliminada correctamente' };
  }
}
