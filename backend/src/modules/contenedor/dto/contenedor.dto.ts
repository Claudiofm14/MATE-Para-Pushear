import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const tipos = [
  'bienvenida',
  'detalleCursada',
  'canalDeComunicacion',
  'subNivel',
  'evaluacion',
  'entregas',
  'aprobacion',
  'cronograma',
];

export class CreateContenedorDto {
  @ApiPropertyOptional({
    description: 'Título del contenedor',
    example: 'Bienvenidos a Programación Orientada a Objetos II',
    maxLength: 255,
  })
  @ValidateIf((o) => !o.subtitulo)
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título no puede estar vacío si no hay subtítulo' })
  @MaxLength(255, { message: 'El título no puede tener más de 255 caracteres' })
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Subtítulo del contenedor',
    example: 'Les damos la bienvenida a este cuatrimestre en la materia',
  })
  @ValidateIf((o) => !o.titulo)
  @IsString({ message: 'El subtítulo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El subtítulo no puede estar vacío si no hay título' })
  subtitulo?: string;

  @ApiProperty({
    description: 'Tipo de contenedor',
    example: 'bienvenida',
    enum: tipos,
  })
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  @IsIn(tipos, { message: `El tipo debe ser uno de: ${tipos.join(', ')}` })
  tipo: string;

  @ApiPropertyOptional({
    description:
      'Lista de contenedores hijos (subniveles). Solo aplica para tipos como detalleCursada o canalDeComunicacion',
    type: 'array',
    example: [
      {
        titulo: 'Comision 1 - Viernes',
        subtitulo: 'Profesor Gerardo G.',
        tipo: 'subNivel',
      },
      {
        titulo: 'Comision 2 - Miercoles',
        subtitulo: 'Profesor Hernan C.',
        tipo: 'subNivel',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateSubnivelDto)
  @IsOptional()
  hijos?: CreateSubnivelDto[];
}

export class CreateSubnivelDto extends CreateContenedorDto {
  @ApiProperty({
    description: 'Tipo de contenedor (siempre subNivel para subniveles)',
    example: 'subNivel',
    enum: ['subNivel'],
  })
  @IsIn(['subNivel'], { message: 'Los hijos deben ser de tipo "subNivel"' })
  tipo!: string;
}

export class UpdateContenedorDto {
  @ApiPropertyOptional({
    description: 'Título del contenedor',
    example: 'Detalles de la Cursada (Actualizado)',
    maxLength: 255,
  })
  @ValidateIf((o) => !o.subtitulo)
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(255, { message: 'El título no puede tener más de 255 caracteres' })
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Subtítulo del contenedor',
    example:
      'Las clases serán virtuales los lunes y miércoles, con consultas presenciales los viernes.',
  })
  @ValidateIf((o) => !o.titulo)
  @IsString({ message: 'El subtítulo debe ser una cadena de texto' })
  @IsOptional()
  subtitulo?: string;

  @ApiPropertyOptional({
    description: 'Tipo de contenedor',
    example: 'detalleCursada',
    enum: tipos,
  })
  @IsOptional()
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @IsIn(tipos, { message: `El tipo debe ser uno de: ${tipos.join(', ')}` })
  tipo?: string;

  @ApiPropertyOptional({
    description:
      'Lista de contenedores hijos (subniveles). Solo aplica para tipos como detalleCursada o canalDeComunicacion',
    type: 'array',
    example: [
      {
        titulo: 'Teams',
        subtitulo: 'teams.microsoft.com',
        tipo: 'subNivel',
      },
      {
        titulo: 'Slack',
        subtitulo: 'slack.com/matematica',
        tipo: 'subNivel',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => UpdateSubnivelDto)
  @IsOptional()
  hijos?: UpdateSubnivelDto[];
}

export class UpdateSubnivelDto extends UpdateContenedorDto {
  @ApiProperty({
    description: 'Tipo de contenedor (siempre subNivel para subniveles)',
    example: 'subNivel',
    enum: ['subNivel'],
  })
  @IsIn(['subNivel'], { message: 'Los hijos deben ser de tipo "subNivel"' })
  tipo!: string;
}
