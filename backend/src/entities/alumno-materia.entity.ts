import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Usuario } from './usuario.entity';
import { Materia } from './materia.entity';
import { Comision } from './comision.entity';

@Entity('alumno_materia')
// Cubre "where materiaId = X" y "where materiaId = X and estado = Y" (el
// patron de consulta mas repetido: inscripciones por materia/estado).
@Index(['materiaId', 'estado'])
export class AlumnoMateria extends ConFecha {
  @ApiProperty({
    description: 'ID único de la relación alumno-materia',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Usuario alumno',
    type: () => Usuario,
  })
  @ManyToOne(() => Usuario, (usuario) => usuario.materiasAlumno, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'alumnoId' })
  alumno: Usuario;

  @Index()
  @Column()
  alumnoId: number;

  @ApiProperty({
    description: 'Materia a la que está inscrito',
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
    description: 'Comisión asignada al alumno',
    type: () => Comision,
  })
  @ManyToOne(() => Comision, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comisionId' })
  comision: Comision;

  @Index()
  @Column()
  comisionId: number;

  @ApiProperty({
    description: 'Fecha de inscripción',
    example: '2025-03-01T10:00:00Z',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaInscripcion: Date;

  @ApiProperty({
    description: 'Estado de la inscripción',
    example: 'pendiente',
    enum: ['pendiente', 'aprobado', 'rechazado'],
  })
  @Column({
    type: 'enum',
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente',
  })
  estado: string;

  @ApiProperty({
    description: 'Mensaje opcional al aprobar/rechazar',
    example: 'Bienvenido a la materia',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  mensaje: string;
}
