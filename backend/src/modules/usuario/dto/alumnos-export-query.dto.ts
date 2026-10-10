import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class AlumnosExportQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursadaId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  comisionId?: number;

  @IsIn(['csv', 'xlsx'])
  format: 'csv' | 'xlsx';
}
