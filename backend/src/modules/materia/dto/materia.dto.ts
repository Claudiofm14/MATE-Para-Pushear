import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateMateriaDto {
  @ApiProperty({
    description: 'Nombre de la materia',
    example: 'Programación con Objetos 2',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({
    description: 'Código único de la materia',
    example: 'POO2-2024-C1',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({
    description: 'Descripción de la materia',
    example: 'Materia avanzada de programación orientada a objetos',
    required: false,
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Cuatrimestre (1 o 2)',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(2)
  @IsOptional()
  cuatrimestre?: number;

  @ApiProperty({
    description: 'Año lectivo',
    example: 2024,
    required: false,
  })
  @IsInt()
  @Min(2020)
  @Max(2100)
  @IsOptional()
  anio?: number;

  @ApiProperty({
    description: 'Estado de la materia (activa/inactiva)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}

export class UpdateMateriaDto extends PartialType(CreateMateriaDto) {
  @ApiProperty({
    description: 'Nombre de la materia',
    example: 'Programación con Objetos 2',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombre?: string;

  @ApiProperty({
    description: 'Código único de la materia',
    example: 'POO2-2024-C1',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  codigo?: string;
}
