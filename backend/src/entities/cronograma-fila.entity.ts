import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConFecha } from './conFecha.abstract.entity';
import { Cursada } from './cursada.entity';
import { CronogramaFilaComision } from './cronograma-fila-comision.entity';

@Entity('cronograma_fila')
@Index('IDX_cronograma_fila_cursada_semana_fecha', [
  'cursadaId',
  'numeroSemana',
  'fecha',
])
export class CronogramaFila extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cursadaId: number;

  @ManyToOne(() => Cursada, (cursada) => cursada.cronogramaFilas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cursadaId' })
  cursada: Cursada;

  @Column({ type: 'integer' })
  numeroSemana: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time', nullable: true })
  hora: string | null;

  @Column({ type: 'varchar', length: 4000, default: '' })
  actividades: string;

  @Column({ type: 'varchar', length: 4000, default: '' })
  temas: string;

  @Column({ type: 'varchar', length: 4000, default: '' })
  tareas: string;

  @OneToMany(() => CronogramaFilaComision, (item) => item.cronogramaFila, {
    cascade: true,
  })
  comisiones: CronogramaFilaComision[];
}
