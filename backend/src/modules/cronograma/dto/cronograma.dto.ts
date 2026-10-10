import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CronogramaModalidad } from '../../../entities/cronograma-fila-comision.entity';

export class CronogramaComisionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  comisionId: number;

  @IsEnum(CronogramaModalidad)
  modalidad: CronogramaModalidad;
}

export class CreateCronogramaFilaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numeroSemana: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener formato YYYY-MM-DD',
  })
  fecha: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora debe tener formato HH:mm',
  })
  hora?: string | null;

  @IsString()
  @MaxLength(4000)
  actividades: string;

  @IsString()
  @MaxLength(4000)
  temas: string;

  @IsString()
  @MaxLength(4000)
  tareas: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos una comisión' })
  @ValidateNested({ each: true })
  @Type(() => CronogramaComisionDto)
  comisiones: CronogramaComisionDto[];
}

export class UpdateCronogramaFilaDto extends PartialType(
  CreateCronogramaFilaDto,
) {}

export class CronogramaQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  comisionId?: number;
}
