import {
  IsInt,
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsArray,
  ValidateNested,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateContenedorDto } from 'src/modules/contenedor/dto/contenedor.dto';
import { MockUtils } from '../../../utils/mock.utils';

//······ CONTRATO PEDAGOGICO ······

//CREATE
export class ContratoPedagogicoDto {
  @ApiProperty({
    description: 'Título del contrato pedagógico',
    example: MockUtils.getContratoExample().titulo,
    maxLength: 100,
  })
  @IsString({ message: 'El título del contrato debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título del contrato es obligatorio' })
  @MaxLength(100, {
    message: 'El título del contrato no puede tener más de 100 caracteres',
  })
  titulo: string;

  @ApiProperty({
    description:
      'Lista de secciones del contrato pedagógico. Cada sección contiene información específica sobre aspectos del curso.',
    type: 'array',
    example: MockUtils.getSeccionesExample(),
  })
  @IsArray({ message: 'Las secciones deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateContenedorDto)
  secciones: CreateContenedorDto[];

  @ApiProperty({
    description: 'ID de la materia a la que pertenece el contrato pedagógico',
    example: 1,
  })
  @IsInt({ message: 'El ID de la materia debe ser un número entero' })
  @IsPositive({ message: 'El ID de la materia debe ser un número positivo' })
  @IsNotEmpty({ message: 'El ID de la materia es obligatorio' })
  materiaId: number;
}

//UPDATE
export class UpdateContratoDto {
  @ApiPropertyOptional({
    description: 'Título del contrato pedagógico',
    example: 'Contrato Pedagógico - Programación Avanzada (Actualizado)',
    maxLength: 100,
  })
  @IsString({ message: 'El título del contrato debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título del contrato es obligatorio' })
  @MaxLength(100, {
    message: 'El título del contrato no puede tener más de 100 caracteres',
  })
  @IsOptional()
  titulo?: string;

  @ApiPropertyOptional({
    description:
      'Lista de secciones del contrato pedagógico. Cada sección contiene información específica sobre aspectos del curso.',
    type: 'array',
    example: MockUtils.getSeccionesExample(),
  })
  @IsArray({ message: 'Las secciones deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateContenedorDto)
  @IsOptional()
  secciones?: CreateContenedorDto[];
}
