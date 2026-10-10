import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SolicitudInscripcionDto {
  @ApiProperty({
    description: 'ID de la materia',
    example: 1,
  })
  @IsNumber()
  materiaId: number;

  @ApiProperty({
    description: 'ID de la comisión',
    example: 1,
  })
  @IsNumber()
  comisionId: number;
}

export class AprobarSolicitudDto {
  @ApiProperty({
    description: 'Mensaje opcional al aprobar la solicitud',
    example: 'Bienvenido a la materia',
    required: false,
  })
  @IsString()
  @IsOptional()
  mensaje?: string;
}

export class RechazarSolicitudDto {
  @ApiProperty({
    description: 'Mensaje opcional al rechazar la solicitud',
    example: 'La comisión está completa',
    required: false,
  })
  @IsString()
  @IsOptional()
  mensaje?: string;
}
