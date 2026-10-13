import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { UsuarioService } from '../usuario/usuario.service';
import { AvanceService } from './avance.service';

class AvanceQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  comisionId?: number;
}

@ApiTags('Avance de cursada')
@ApiBearerAuth()
@Controller('avance/cursada')
export class AvanceController {
  constructor(
    private readonly service: AvanceService,
    private readonly usuarioService: UsuarioService,
  ) {}

  @Get(':cursadaId')
  @ApiOperation({
    summary: 'Mapa de avance propio o simulación docente de la cursada',
  })
  async obtener(
    @Request() req,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
    @Query() query: AvanceQueryDto,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return this.service.obtener(
      cursadaId,
      usuario,
      req.user.realm_access?.roles || [],
      query.comisionId,
    );
  }

  @Put(':cursadaId/ejercicio/:ejercicioId')
  @ApiOperation({
    summary: 'Registrar una actividad como entregada en el avance propio',
  })
  async completar(
    @Request() req,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
    @Param('ejercicioId', ParseIntPipe) ejercicioId: number,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return this.service.completar(
      cursadaId,
      ejercicioId,
      usuario,
      req.user.realm_access?.roles || [],
    );
  }

  @Delete(':cursadaId/completadas')
  @ApiOperation({
    summary: 'Reiniciar exclusivamente el avance propio de una cursada',
  })
  async reiniciar(
    @Request() req,
    @Param('cursadaId', ParseIntPipe) cursadaId: number,
  ) {
    const usuario = await this.usuarioService.obtenerOCrearUsuario(req.user);
    return this.service.reiniciar(
      cursadaId,
      usuario,
      req.user.realm_access?.roles || [],
    );
  }
}
