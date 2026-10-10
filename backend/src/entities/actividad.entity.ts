import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Materia } from './materia.entity';
import { Comision } from './comision.entity';

@Entity('actividad')
export class Actividad {
  @ApiProperty({
    description: 'ID único de la actividad',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nombre de la actividad',
    example: 'TP1 - Lista Enlazada',
  })
  @Column()
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la actividad',
    example: 'Implementar una lista enlazada simple',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @ApiProperty({
    description:
      'URL base del repositorio que se concatenara con el username de Gitea del alumno',
    example: 'http://gitea-unahur.duckdns.org/curso-obj2/tp1-',
  })
  @Column()
  repositorioBase: string;

  @ApiProperty({
    description: 'Tipo de calificación para esta actividad',
    enum: ['numerico', 'conceptual'],
    example: 'numerico',
  })
  @Column({
    type: 'enum',
    enum: ['numerico', 'conceptual'],
    default: 'numerico',
  })
  tipoCalificacion: 'numerico' | 'conceptual';

  @ApiProperty({
    description: 'Materia a la que pertenece la actividad',
    type: () => Materia,
  })
  @ManyToOne(() => Materia, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @Column()
  materiaId: number;

  @ApiProperty({
    description:
      'Comisiones a las que aplica la actividad. Si esta vacio, aplica a todas.',
    type: () => [Comision],
    required: false,
  })
  @ManyToMany(() => Comision, (comision) => comision.actividades)
  @JoinTable({
    name: 'actividad_comision',
    joinColumn: { name: 'actividad_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'comision_id', referencedColumnName: 'id' },
  })
  comisiones: Comision[];

  @ApiProperty({
    description: 'Indica si la actividad está activa',
    example: true,
  })
  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
