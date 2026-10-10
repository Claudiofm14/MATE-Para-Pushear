import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Semana } from './semana.entity';

export type TipoActividadEjercicio =
  | 'programacion'
  | 'enlace'
  | 'archivo'
  | 'instrucciones';

export type TipoRecursoEjercicio =
  | 'planilla'
  | 'documento'
  | 'presentacion'
  | 'pdf'
  | 'video'
  | 'otro';
export type AssignmentMode = 'individual' | 'group';

@Entity()
export class Ejercicio extends ConFecha {
  @ApiProperty({
    description: 'ID único del ejercicio',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Título del ejercicio',
    example: 'Ejercicio 1 - Clases y Objetos',
  })
  @Column({ length: 100 })
  titulo: string;

  @ApiProperty({
    description: 'Descripción del ejercicio',
    example: 'Crear una clase Persona con atributos nombre y edad',
  })
  @Column({ type: 'text' })
  descripcion: string;

  @ApiProperty({
    description: 'URL del repositorio del ejercicio (opcional)',
    example: 'http://gitea-unahur.duckdns.org/usuario/ejercicios/ejercicio1',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  url?: string;

  @ApiProperty({
    description: 'URL del repositorio de ejemplo (opcional)',
    example: 'http://gitea-unahur.duckdns.org/profesor/ejemplo-ejercicio1',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  repositorioEjemplo?: string;

  @ApiProperty({
    description: 'URL del README con instrucciones (opcional)',
    example:
      'http://gitea-unahur.duckdns.org/usuario/ejercicios/src/branch/main/README.md',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  readmeUrl?: string;

  @ApiProperty({
    description: 'URL de asignacion externa o repositorio base (opcional)',
    example: 'http://gitea-unahur.duckdns.org/curso/ejercicio1',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  classroomUrl?: string;

  @ApiProperty({
    description: 'Tipo de actividad publicada en la semana',
    example: 'programacion',
    enum: ['programacion', 'enlace', 'archivo', 'instrucciones'],
    required: false,
  })
  @Column({ type: 'varchar', length: 32, default: 'programacion' })
  tipoActividad: TipoActividadEjercicio;

  @ApiProperty({
    description: 'Tipo de recurso externo cuando la actividad no usa Gitea',
    example: 'planilla',
    enum: ['planilla', 'documento', 'presentacion', 'pdf', 'video', 'otro'],
    required: false,
  })
  @Column({ type: 'varchar', length: 32, nullable: true })
  recursoTipo?: TipoRecursoEjercicio;

  @ApiProperty({
    description: 'URL principal del recurso externo',
    example: 'https://docs.google.com/spreadsheets/d/...',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  recursoUrl?: string;

  @ApiProperty({
    description: 'Etiqueta visible para el recurso externo',
    example: 'Abrir planilla de seguimiento',
    required: false,
  })
  @Column({ type: 'varchar', length: 120, nullable: true })
  recursoTitulo?: string;

  @ApiProperty({
    description: 'Fecha de entrega del ejercicio (opcional)',
    example: '2024-12-31',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  fechaEntrega?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  giteaTemplateOwner?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  giteaTemplateRepo?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  giteaTemplateRepoId?: string;

  @Column({ type: 'text', nullable: true })
  giteaTemplateCloneUrl?: string;

  @Column({ type: 'boolean', default: false })
  giteaAutoCreateRepo: boolean;

  @Column({ type: 'varchar', length: 16, default: 'individual' })
  assignmentMode: AssignmentMode;

  @Column({ type: 'integer', nullable: true })
  minGroupSize?: number;

  @Column({ type: 'integer', nullable: true })
  maxGroupSize?: number;

  @Column({ type: 'timestamp', nullable: true })
  groupsLockedAt?: Date;

  @Column({ type: 'boolean', default: true })
  allowStudentGroupCreation: boolean;

  @Column({ type: 'boolean', default: false })
  allowLeaveAfterRepositoryCreation: boolean;

  @ManyToOne(() => Semana, (semana) => semana.ejercicios, {
    onDelete: 'CASCADE',
  })
  semana: Semana;
}
