import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
  IsArray,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateContenedorDto } from '../../contenedor/dto/contenedor.dto';
import { MockUtils } from '../../../utils/mock.utils';

export class CreateInicioDto {
  @ApiProperty({
    description: 'Título de la página de inicio',
    example: MockUtils.getInicioExample().titulo,
    maxLength: 255,
  })
  @IsString({ message: 'El titulo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El titulo es obligatorio' })
  @MaxLength(255, { message: 'El titulo no puede tener más de 255 caracteres' })
  titulo: string;

  @ApiProperty({
    description: 'ID de la materia a la que pertenece este inicio',
    example: 1,
  })
  @IsInt({ message: 'El ID de la materia debe ser un número entero' })
  @IsPositive({ message: 'El ID de la materia debe ser un número positivo' })
  @IsNotEmpty({ message: 'El ID de la materia es obligatorio' })
  materiaId: number;

  @ApiProperty({
    description: 'Lista de contenedores para la página de inicio',
    type: 'array',
    example: MockUtils.getContenedoresExample(),
  })
  @IsArray({ message: 'Los contenedores deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateContenedorDto)
  contenedores: CreateContenedorDto[];

  @ApiPropertyOptional({
    description: 'Contenido libre en formato de bloques',
    example: {
      blocks: [
        {
          id: '123',
          type: 'text',
          data: {
            titulo: 'Bienvenida',
            contenido: 'Contenido de la pagina de inicio...',
          },
        },
      ],
    },
  })
  @IsOptional()
  contenido?: any;
}

export class UpdateInicioDto {
  @ApiPropertyOptional({
    description: 'Título de la página de inicio',
    example: 'Matemática Avanzada (Actualizado)',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Lista de contenedores para la página de inicio',
    type: 'array',
    example: MockUtils.getContenedoresExample(),
  })
  @IsArray({ message: 'Los contenedores deben ser un array' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateContenedorDto) // Cambiado de UpdateContenedorDto a CreateContenedorDto
  contenedores?: CreateContenedorDto[];

  @ApiPropertyOptional({
    description: 'Contenido libre en formato de bloques',
  })
  @IsOptional()
  contenido?: any;
}

// en la pagina de inicio tenemos diferentes containers.
// el primero que seria la bienvenida (titulo y descripcion),
// el segundo los datos de la cursada (titulo y descripcion) detalles como comisiones y horarios,
// el tercero los canales de comunicacion (titulo, lista de [titulo y descripcion])
