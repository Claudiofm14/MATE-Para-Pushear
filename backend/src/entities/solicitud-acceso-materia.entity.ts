import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Materia } from './materia.entity';

@Entity('solicitud_acceso_materia')
export class SolicitudAccesoMateria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'docente_id' })
  docenteId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'docente_id' })
  docente: Usuario;

  @Column({ name: 'materia_id' })
  materiaId: number;

  @ManyToOne(() => Materia)
  @JoinColumn({ name: 'materia_id' })
  materia: Materia;

  // Guardamos los IDs de las comisiones solicitadas como un array simple
  // Esto simplifica la relación ya que es una solicitud temporal
  @Column('simple-array', { nullable: true })
  comisionIds: number[];

  @Column({
    type: 'enum',
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente',
  })
  estado: 'pendiente' | 'aprobado' | 'rechazado';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
