import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AsignarAlumnoCursadaDto {
  @ApiProperty({ description: 'ID del alumno a asignar', example: 12 })
  @IsInt()
  @IsPositive()
  alumnoId: number;

  @ApiProperty({ description: 'ID de la comisión de la cursada', example: 3 })
  @IsInt()
  @IsPositive()
  comisionId: number;
}
