import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateSemanaDto {
  @ApiProperty({
    description: 'Título de la semana',
    example: 'Semana 1 - Introducción',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  titulo: string;

  @ApiProperty({
    description: 'Descripción de la semana',
    example:
      'En esta semana veremos los conceptos básicos de programación orientada a objetos',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({
    description: 'Número de semana',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  numeroSemana: number;

  @ApiProperty({
    description: 'Fecha de inicio de la semana',
    example: '2024-03-20',
  })
  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @ApiProperty({
    description: 'Hora argentina de inicio de publicación (formato HH:mm)',
    example: '08:00',
    required: false,
  })
  @IsString()
  @IsOptional()
  horaInicio?: string;

  @ApiProperty({
    description: 'Información importante de la semana',
    example: 'Recordar traer notebook para la clase práctica',
    required: false,
  })
  @IsString()
  @IsOptional()
  importante?: string;

  @ApiProperty({
    description: 'Avisos de la semana',
    example: 'La clase del miércoles será virtual',
    required: false,
  })
  @IsString()
  @IsOptional()
  avisos?: string;

  @ApiProperty({
    description: 'Contenido rico en formato de bloques',
    required: false,
    example: {
      blocks: [
        {
          id: '123',
          type: 'text',
          data: {
            titulo: 'Introducción',
            contenido: 'Contenido de la semana...',
          },
        },
      ],
    },
  })
  @IsOptional()
  contenido?: any;

  @ApiProperty({
    description: 'ID de la cursada',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  cursadaId: number;

  @ApiProperty({
    description:
      'IDs de las comisiones (opcional, si no se especifica se asigna a todas)',
    example: [1, 2],
    required: false,
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  comisionIds?: number[];

  @ApiProperty({
    description: 'Fecha de clase por comision en formato YYYY-MM-DD',
    example: { '1': '2026-06-11', '2': '2026-06-12' },
    required: false,
  })
  @IsOptional()
  fechasClasePorComision?: Record<string, string>;
}

export class UpdateSemanaDto extends PartialType(CreateSemanaDto) {}
