import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsUrl,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateMaterialAcademicoDto {
  @IsString()
  @MinLength(1)
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @ValidateIf((o) => o.url && o.url.trim() !== '')
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  textoBoton?: string;

  @IsOptional()
  @IsObject()
  contenido?: any;

  @IsOptional()
  @IsString()
  icono?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsNumber()
  materiaId: number;
}

export class UpdateMaterialAcademicoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @ValidateIf((o) => o.url && o.url.trim() !== '')
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  textoBoton?: string;

  @IsOptional()
  @IsObject()
  contenido?: any;

  @IsOptional()
  @IsString()
  icono?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsNumber()
  materiaId?: number;
}
