import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
} from 'class-validator';

export class CreateActividadDto {
  @ApiProperty({
    description: 'Nombre de la actividad',
    example: 'TP1 - Lista Enlazada',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la actividad',
    example: 'Implementar una lista enlazada simple',
    required: false,
  })
  @IsString()
  @IsOptional()
  descripcion?: string | null;

  @ApiProperty({
    description: 'URL base del repositorio',
    example: 'http://gitea-unahur.duckdns.org/curso-obj2/tp1-',
  })
  @IsString()
  @IsNotEmpty()
  repositorioBase: string;

  @ApiProperty({
    description: 'Tipo de calificación',
    enum: ['numerico', 'conceptual'],
    example: 'numerico',
  })
  @IsEnum(['numerico', 'conceptual'])
  @IsNotEmpty()
  tipoCalificacion: 'numerico' | 'conceptual';

  @ApiProperty({
    description: 'ID de la materia',
    example: 1,
  })
  @IsNotEmpty()
  materiaId: number;

  @ApiProperty({
    description:
      'IDs de comisiones a las que aplica. Si se omite o esta vacio, aplica a todas.',
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  comisionIds?: number[];
}

export class UpdateActividadDto {
  @ApiProperty({
    description: 'Nombre de la actividad',
    example: 'TP1 - Lista Enlazada',
    required: false,
  })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiProperty({
    description:
      'Descripción de la actividad. Enviar null o vacío para quitarla.',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  descripcion?: string | null;

  @ApiProperty({
    description: 'URL base del repositorio',
    required: false,
  })
  @IsString()
  @IsOptional()
  repositorioBase?: string;

  @ApiProperty({
    description: 'Tipo de calificación',
    enum: ['numerico', 'conceptual'],
    required: false,
  })
  @IsEnum(['numerico', 'conceptual'])
  @IsOptional()
  tipoCalificacion?: 'numerico' | 'conceptual';

  @ApiProperty({
    description: 'Indica si la actividad está activa',
    required: false,
  })
  @IsOptional()
  activo?: boolean;

  @ApiProperty({
    description:
      'IDs de comisiones a las que aplica. Si se envia vacio, aplica a todas.',
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  comisionIds?: number[];
}

export class UpdateEntregaDto {
  @ApiProperty({
    description: 'Nota numérica (0-10)',
    example: 8.5,
    required: false,
  })
  @IsOptional()
  notaNumerica?: number;

  @ApiProperty({
    description: 'Nota conceptual',
    enum: [
      'aprobado',
      'desaprobado',
      'excelente',
      'muy_bueno',
      'bueno',
      'regular',
      'insuficiente',
    ],
    required: false,
  })
  @IsOptional()
  @IsString()
  notaConceptual?: string;

  @ApiProperty({
    description: 'Comentario del docente',
    required: false,
  })
  @IsOptional()
  @IsString()
  comentario?: string;
}

export class BulkUpdateEntregaDto {
  @ApiProperty({
    description: 'ID de la actividad',
    example: 1,
  })
  @IsNotEmpty()
  actividadId: number;

  @ApiProperty({
    description: 'ID del alumno',
    example: 5,
  })
  @IsNotEmpty()
  alumnoId: number;

  @ApiProperty({
    description: 'Datos de la entrega',
    type: UpdateEntregaDto,
  })
  @IsNotEmpty()
  entrega: UpdateEntregaDto;
}
