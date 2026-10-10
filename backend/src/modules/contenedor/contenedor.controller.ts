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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateContenedorDto, UpdateContenedorDto } from './dto/contenedor.dto';
import { ContenedorService } from './contenedor.service';
import { Contenedor } from '../../entities/contenedor.entity';
import { USER_ROLES, Roles } from '../../auth';

@ApiTags('Contenedor')
@ApiBearerAuth()
@Controller('contenedor')
export class ContenedorController {
  constructor(private readonly contenedorService: ContenedorService) {}

  @ApiOperation({ summary: 'Obtener todos los contenedores' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los contenedores',
    type: [Contenedor],
  })
  @Get()
  @Roles(USER_ROLES.ADMIN)
  async findAll(): Promise<Contenedor[]> {
    return this.contenedorService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un contenedor por ID' })
  @ApiParam({ name: 'id', description: 'ID del contenedor', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Contenedor encontrado',
    type: Contenedor,
  })
  @ApiResponse({
    status: 404,
    description: 'Contenedor no encontrado',
  })
  @Get(':id')
  @Roles(USER_ROLES.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Contenedor> {
    return this.contenedorService.findOne(id);
  }

  @ApiOperation({ summary: 'Crear un nuevo contenedor' })
  @ApiBody({ type: CreateContenedorDto })
  @ApiResponse({
    status: 201,
    description: 'Contenedor creado exitosamente',
    type: Contenedor,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @Post()
  @Roles(USER_ROLES.ADMIN)
  async create(
    @Body() createContenedorDto: CreateContenedorDto,
  ): Promise<Contenedor> {
    return this.contenedorService.create(createContenedorDto);
  }

  @ApiOperation({ summary: 'Actualizar un contenedor existente' })
  @ApiParam({ name: 'id', description: 'ID del contenedor', type: 'number' })
  @ApiBody({ type: UpdateContenedorDto })
  @ApiResponse({
    status: 200,
    description: 'Contenedor actualizado exitosamente',
    type: Contenedor,
  })
  @ApiResponse({
    status: 404,
    description: 'Contenedor no encontrado',
  })
  @Put(':id')
  @Roles(USER_ROLES.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContenedorDto: UpdateContenedorDto,
  ): Promise<Contenedor> {
    return this.contenedorService.update(id, updateContenedorDto);
  }

  @ApiOperation({ summary: 'Eliminar un contenedor (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del contenedor', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Contenedor eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Contenedor con ID 1 eliminado correctamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Contenedor no encontrado',
  })
  @Delete(':id')
  @Roles(USER_ROLES.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.contenedorService.remove(id);
    return { message: `Contenedor con ID ${id} eliminado correctamente` };
  }

  @ApiOperation({ summary: 'Restaurar un contenedor eliminado' })
  @ApiParam({ name: 'id', description: 'ID del contenedor', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Contenedor restaurado exitosamente',
    type: Contenedor,
  })
  @ApiResponse({
    status: 404,
    description: 'Contenedor no encontrado',
  })
  @Patch(':id')
  @Roles(USER_ROLES.ADMIN)
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Contenedor> {
    return this.contenedorService.restore(id);
  }
}
