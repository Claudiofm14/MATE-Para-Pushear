import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Actividad } from './actividad.entity';
import { Usuario } from './usuario.entity';

@Index('IDX_entrega_actividad_actividad_alumno', ['actividadId', 'alumnoId'], {
  unique: true,
})
@Entity('entrega_actividad')
export class EntregaActividad {
  @ApiProperty({
    description: 'ID único de la entrega',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Actividad asociada',
    type: () => Actividad,
  })
  @ManyToOne(() => Actividad, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actividadId' })
  actividad: Actividad;

  @Column()
  actividadId: number;

  @ApiProperty({
    description: 'Alumno que realizó la entrega',
    type: () => Usuario,
  })
  @ManyToOne(() => Usuario, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'alumnoId' })
  alumno: Usuario;

  @Column()
  alumnoId: number;

  @ApiProperty({
    description:
      'Calificación numérica (usado cuando tipoCalificacion es numerico)',
    example: 8.5,
    required: false,
  })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  notaNumerica: number;

  @ApiProperty({
    description:
      'Calificación conceptual (usado cuando tipoCalificacion es conceptual)',
    example: 'aprobado',
    enum: [
      'aprobado',
      'desaprobado',
      'excelente',
      'muy_bueno',
      'bueno',
      'regular',
      'insuficiente',
    ],
    required: false,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  notaConceptual: string;

  @ApiProperty({
    description: 'Comentario del docente sobre la entrega',
    example: 'Buen trabajo, pero falta documentación',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  comentario: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
