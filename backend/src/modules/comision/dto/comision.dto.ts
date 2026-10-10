import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  MaxLength,
} from 'class-validator';

export class CreateComisionDto {
  @ApiProperty({
    description: 'Nombre de la comisión',
    example: 'Comisión A - Lunes',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la comisión',
    example: 'Comisión de lunes y miércoles de 18 a 20hs',
    required: false,
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'ID de la cursada',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  cursadaId: number;
}

export class UpdateComisionDto extends PartialType(CreateComisionDto) {}
