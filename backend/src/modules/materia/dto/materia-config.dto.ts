import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class MateriaTabsConfigDto {
  @IsBoolean()
  @IsOptional()
  inicio?: boolean;

  @IsBoolean()
  @IsOptional()
  material?: boolean;

  @IsBoolean()
  @IsOptional()
  videos?: boolean;

  @IsBoolean()
  @IsOptional()
  semanas?: boolean;

  @IsBoolean()
  @IsOptional()
  cronograma?: boolean;

  @IsBoolean()
  @IsOptional()
  misAlumnos?: boolean;

  @IsBoolean()
  @IsOptional()
  planilla?: boolean;

  @IsBoolean()
  @IsOptional()
  contratoPedagogico?: boolean;

  @IsBoolean()
  @IsOptional()
  logs?: boolean;

  @IsBoolean()
  @IsOptional()
  configuracion?: boolean;
}

export class UpdateMateriaConfigDto {
  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  tabs?: MateriaTabsConfigDto;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  pages?: Record<string, { titulo?: string; descripcion?: string }>;
}
