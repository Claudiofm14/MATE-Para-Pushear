import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateContenedorDto,
  UpdateContenedorDto,
} from '../../contenedor/dto/contenedor.dto';
import { MockUtils } from '../../../utils/mock.utils';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Título del material',
    example: MockUtils.getMaterialExample().titulo,
    maxLength: 255,
  })
  @IsString({ message: 'El titulo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El titulo es obligatorio' })
  @MaxLength(255, { message: 'El titulo no puede tener más de 255 caracteres' })
  titulo: string;

  @ApiProperty({
    description: 'ID de la materia a la que pertenece este material',
    example: 1,
  })
  @IsInt({ message: 'El ID de la materia debe ser un número entero' })
  @IsPositive({ message: 'El ID de la materia debe ser un número positivo' })
  @IsNotEmpty({ message: 'El ID de la materia es obligatorio' })
  materiaId: number;

  @ApiPropertyOptional({
    description:
      'Lista de contenedores asociados al material. Puede incluir varios tipos de contenedores como conceptos básicos, ejercicios, recursos adicionales, etc.',
    type: 'array',
    example: MockUtils.getMaterialExample().contenedores,
  })
  @ValidateNested({ each: true })
  @Type(() => CreateContenedorDto)
  @IsOptional()
  contenedores?: CreateContenedorDto[]; // agregar los tipos validos
}

export class UpdateMaterialDto {
  @ApiPropertyOptional({
    description: 'Título del material',
    example: 'Material Avanzado - Estructuras de Datos',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  titulo?: string;

  @ApiPropertyOptional({
    description:
      'Lista de contenedores asociados al material. Puede incluir varios tipos de contenedores como conceptos básicos, ejercicios, recursos adicionales, etc.',
    type: 'array',
    example: MockUtils.getMaterialUpdateExample().contenedores,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdateContenedorDto)
  @IsOptional()
  contenedores?: UpdateContenedorDto[];
}
