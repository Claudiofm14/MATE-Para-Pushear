import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cursada } from './cursada.entity';
import { Ejercicio } from './ejercicio.entity';
import { Usuario } from './usuario.entity';

// Avance declarado por el alumno, independiente de las notas de la planilla.
@Entity('avance_ejercicio')
@Index(
  'IDX_avance_alumno_cursada_ejercicio',
  ['alumnoId', 'cursadaId', 'ejercicioId'],
  {
    unique: true,
  },
)
export class AvanceEjercicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  alumnoId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alumnoId' })
  alumno: Usuario;

  @Column()
  cursadaId: number;

  @ManyToOne(() => Cursada, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cursadaId' })
  cursada: Cursada;

  @Column()
  ejercicioId: number;

  @ManyToOne(() => Ejercicio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ejercicioId' })
  ejercicio: Ejercicio;

  @CreateDateColumn({ type: 'timestamptz' })
  completadoEn: Date;
}
