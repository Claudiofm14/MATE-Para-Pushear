import { IsNumber, IsArray, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AsignacionProfesorDto {
  @ApiProperty({
    description: 'ID del profesor en el proveedor de autenticacion',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  profesorAuthProviderId: string;

  @ApiProperty({
    description: 'ID de la materia',
    example: 1,
  })
  @IsNumber()
  materiaId: number;

  @ApiProperty({
    description:
      'IDs de comisiones heredados. La asignacion docente es por materia completa.',
    example: [1, 2],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  comisionIds?: number[];
}
