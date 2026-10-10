import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  MaxLength,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateCursadaDto {
  @ApiProperty({
    description: 'Título de la cursada',
    example: 'Cursada 2025 - Primer Cuatrimestre',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  titulo: string;

  @ApiProperty({
    description: 'Descripción de la cursada',
    example: 'Cursada correspondiente al primer cuatrimestre del año 2025',
    required: false,
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Indica si la cursada está activa',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @ApiProperty({
    description: 'Fecha de inicio de la cursada',
    example: '2026-03-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string | null;

  @ApiProperty({
    description: 'Fecha de fin de la cursada',
    example: '2026-07-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fechaFin?: string | null;

  @ApiProperty({
    description: 'ID de la materia',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  materiaId: number;

  @IsBoolean()
  @IsOptional()
  giteaIntegrationEnabled?: boolean;

  @IsString()
  @IsOptional()
  giteaOrgName?: string;

  @IsString()
  @IsOptional()
  giteaOrgId?: string;

  @IsString()
  @IsOptional()
  giteaOrgUrl?: string;
}

export class UpdateCursadaDto extends PartialType(CreateCursadaDto) {}
