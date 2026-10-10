import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  MaxLength,
  IsOptional,
  IsUrl,
  IsDateString,
  IsBoolean,
  IsIn,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  AssignmentMode,
  TipoActividadEjercicio,
  TipoRecursoEjercicio,
} from '../../../entities/ejercicio.entity';

const TIPOS_ACTIVIDAD: TipoActividadEjercicio[] = [
  'programacion',
  'enlace',
  'archivo',
  'instrucciones',
];

const TIPOS_RECURSO: TipoRecursoEjercicio[] = [
  'planilla',
  'documento',
  'presentacion',
  'pdf',
  'video',
  'otro',
];

export class CreateEjercicioDto {
  @ApiProperty({
    description: 'Título del ejercicio',
    example: 'Ejercicio 1 - Clases y Objetos',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  titulo: string;

  @ApiProperty({
    description: 'Descripción del ejercicio',
    example: 'Crear una clase Persona con atributos nombre y edad',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({
    description: 'URL del repositorio del ejercicio (opcional)',
    example: 'http://gitea-unahur.duckdns.org/usuario/ejercicios/ejercicio1',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({
    description: 'URL del repositorio de ejemplo (opcional)',
    example: 'http://gitea-unahur.duckdns.org/profesor/ejemplo-ejercicio1',
    required: false,
  })
  @IsOptional()
  @IsString()
  repositorioEjemplo?: string;

  @ApiProperty({
    description: 'URL del README con instrucciones (opcional)',
    example:
      'http://gitea-unahur.duckdns.org/usuario/ejercicios/src/branch/main/README.md',
    required: false,
  })
  @IsOptional()
  @IsString()
  readmeUrl?: string;

  @ApiProperty({
    description: 'URL de asignacion externa o repositorio base (opcional)',
    example: 'http://gitea-unahur.duckdns.org/curso/ejercicio1',
    required: false,
  })
  @IsOptional()
  @IsString()
  classroomUrl?: string;

  @ApiProperty({
    description: 'Tipo de actividad publicada en la semana',
    example: 'programacion',
    enum: TIPOS_ACTIVIDAD,
    required: false,
  })
  @IsOptional()
  @IsIn(TIPOS_ACTIVIDAD)
  tipoActividad?: TipoActividadEjercicio;

  @ApiProperty({
    description: 'Tipo de recurso externo cuando no es una actividad Gitea',
    example: 'planilla',
    enum: TIPOS_RECURSO,
    required: false,
  })
  @IsOptional()
  @IsIn(TIPOS_RECURSO)
  recursoTipo?: TipoRecursoEjercicio;

  @ApiProperty({
    description: 'URL principal del recurso externo',
    example: 'https://docs.google.com/spreadsheets/d/...',
    required: false,
  })
  @IsOptional()
  @IsString()
  recursoUrl?: string;

  @ApiProperty({
    description: 'Etiqueta visible del recurso externo',
    example: 'Abrir planilla',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  recursoTitulo?: string;

  @ApiProperty({
    description: 'Fecha de entrega del ejercicio (opcional)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fechaEntrega?: string;

  @ApiProperty({
    description: 'ID de la semana',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  semanaId: number;

  @IsOptional()
  @IsString()
  giteaTemplateOwner?: string;

  @IsOptional()
  @IsString()
  giteaTemplateRepo?: string;

  @IsOptional()
  @IsString()
  giteaTemplateRepoId?: string;

  @IsOptional()
  @IsString()
  giteaTemplateCloneUrl?: string;

  @IsOptional()
  @IsBoolean()
  giteaAutoCreateRepo?: boolean;

  @IsOptional() @IsIn(['individual', 'group']) assignmentMode?: AssignmentMode;
  @ValidateIf((o) => o.assignmentMode === 'group')
  @IsInt()
  @Min(1)
  minGroupSize?: number;
  @ValidateIf((o) => o.assignmentMode === 'group')
  @IsInt()
  @Min(1)
  maxGroupSize?: number;
  @IsOptional() @IsDateString() groupsLockedAt?: string;
  @IsOptional() @IsBoolean() allowStudentGroupCreation?: boolean;
  @IsOptional() @IsBoolean() allowLeaveAfterRepositoryCreation?: boolean;
}

export class UpdateEjercicioDto extends PartialType(CreateEjercicioDto) {}
