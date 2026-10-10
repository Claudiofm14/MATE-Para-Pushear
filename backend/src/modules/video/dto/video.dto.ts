import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  MaxLength,
  IsUrl,
  IsOptional,
} from 'class-validator';

export class CreateVideoDto {
  @ApiProperty({
    description: 'Título del video',
    example: 'Introducción a POO - Parte 1',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  titulo: string;

  @ApiProperty({
    description: 'Subtítulo o descripción breve',
    example: 'Conceptos básicos',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitulo?: string;

  @ApiProperty({
    description: 'URL del video de YouTube',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Orden de visualización',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  orden?: number;

  @ApiProperty({
    description: 'ID de la semana',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  semanaId?: number;

  @ApiProperty({
    description: 'ID de la materia (para videos generales)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  materiaId?: number;
}

export class UpdateVideoDto extends PartialType(CreateVideoDto) {}
