import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const ROLES = ['todos', 'alumno', 'docente', 'admin'] as const;
const ESTADOS = ['todos', 'activo', 'suspendido'] as const;

export class AdminUsuariosQueryDto {
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  @IsOptional()
  refreshGitea = false;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  search = '';

  @IsIn(ROLES)
  @IsOptional()
  rol: (typeof ROLES)[number] = 'todos';

  @IsIn(ESTADOS)
  @IsOptional()
  estado: (typeof ESTADOS)[number] = 'todos';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 10;
}
