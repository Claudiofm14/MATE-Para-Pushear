import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  Min,
} from 'class-validator';
import { TipoHorario } from '../../../entities/horario.entity';

export class CreateHorarioDto {
  @ApiProperty({
    description: 'Título del horario',
    example: 'Clase Teórica',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  titulo: string;

  @ApiProperty({
    description: 'Tipo de clase',
    example: 'presencial',
    enum: TipoHorario,
  })
  @IsEnum(TipoHorario)
  @IsNotEmpty()
  tipo: TipoHorario;

  @ApiProperty({
    description: 'Detalle del horario',
    example: 'Lunes 18:00 a 20:00 - Aula 305',
  })
  @IsString()
  @IsNotEmpty()
  detalle: string;

  @ApiProperty({
    description:
      'URL para clases virtuales. Enviar null para quitar el enlace guardado.',
    example: 'https://meet.google.com/abc-defg-hij',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  url?: string | null;

  @ApiProperty({
    description: 'ID de la semana',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  semanaId: number;
}

export class UpdateHorarioDto extends PartialType(CreateHorarioDto) {}

export class ReorderHorariosDto {
  @ApiProperty({
    description: 'IDs de todos los horarios de la semana en el orden deseado',
    example: [3, 1, 2],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  horarioIds: number[];
}
