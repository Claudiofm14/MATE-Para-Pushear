import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ReporteSoporteCategoria,
  ReporteSoporteEstado,
} from '../../../entities/reporte-soporte.entity';

export class CrearReporteDto {
  @ApiProperty({
    description: 'Tipo de reporte',
    enum: ReporteSoporteCategoria,
    example: ReporteSoporteCategoria.BUG,
  })
  @IsEnum(ReporteSoporteCategoria)
  categoria: ReporteSoporteCategoria;

  @ApiProperty({
    description: 'Resumen corto del reporte',
    example: 'No carga el video de la semana 3',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(140)
  asunto: string;

  @ApiProperty({
    description: 'Primer mensaje del hilo',
    example: 'Cuando entro a la semana 3 el reproductor queda en negro.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  mensaje: string;

  @ApiPropertyOptional({
    description: 'Ruta desde la que se abrio el reporte',
    example: '/materia/3/semanas/12',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paginaOrigen?: string;
}

export class ResponderReporteDto {
  @ApiPropertyOptional({
    description:
      'Texto del mensaje. Puede omitirse solo si se adjunta una imagen.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  mensaje?: string;
}

export class ListarReportesDto {
  @ApiPropertyOptional({ enum: ReporteSoporteEstado })
  @IsOptional()
  @IsEnum(ReporteSoporteEstado)
  estado?: ReporteSoporteEstado;

  @ApiPropertyOptional({ enum: ReporteSoporteCategoria })
  @IsOptional()
  @IsEnum(ReporteSoporteCategoria)
  categoria?: ReporteSoporteCategoria;
}
