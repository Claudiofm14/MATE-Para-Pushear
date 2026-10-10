import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Comision } from './comision.entity';
import { CronogramaFila } from './cronograma-fila.entity';

export enum CronogramaModalidad {
  PRESENCIAL = 'presencial',
  VIRTUAL = 'virtual',
}

@Entity('cronograma_fila_comision')
@Unique('UQ_cronograma_fila_comision', ['cronogramaFilaId', 'comisionId'])
export class CronogramaFilaComision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cronogramaFilaId: number;

  @ManyToOne(() => CronogramaFila, (fila) => fila.comisiones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cronogramaFilaId' })
  cronogramaFila: CronogramaFila;

  @Column()
  comisionId: number;

  @ManyToOne(() => Comision, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comisionId' })
  comision: Comision;

  @Column({ type: 'enum', enum: CronogramaModalidad })
  modalidad: CronogramaModalidad;
}
