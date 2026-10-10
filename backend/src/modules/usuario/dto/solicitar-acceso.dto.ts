import { IsArray, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SolicitarAccesoDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  materiaId: number;

  @ApiProperty({
    type: [Number],
    required: false,
    description:
      'IDs de comisiones heredados. El acceso docente se solicita por materia completa.',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  comisionIds?: number[];
}
