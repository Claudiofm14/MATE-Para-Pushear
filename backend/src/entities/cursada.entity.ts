import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Materia } from './materia.entity';
import { Comision } from './comision.entity';
import { Semana } from './semana.entity';
import { CronogramaFila } from './cronograma-fila.entity';

@Entity()
export class Cursada extends ConFecha {
  @ApiProperty({
    description: 'ID único de la cursada',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Título de la cursada',
    example: 'Cursada 2025 - Primer Cuatrimestre',
  })
  @Column({ length: 100 })
  titulo: string;

  @ApiProperty({
    description: 'Descripción de la cursada',
    example: 'Cursada correspondiente al primer cuatrimestre del año 2025',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @ApiProperty({
    description: 'Indica si la cursada está activa',
    example: true,
    default: true,
  })
  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @ApiProperty({
    description: 'Fecha de inicio de la cursada',
    example: '2026-03-01',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  fechaInicio: string | null;

  @ApiProperty({
    description: 'Fecha de fin de la cursada',
    example: '2026-07-15',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  fechaFin: string | null;

  @Column({ type: 'boolean', default: false })
  giteaIntegrationEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  giteaOrgName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  giteaOrgId?: string;

  @Column({ type: 'text', nullable: true })
  giteaOrgUrl?: string;

  @ManyToOne(() => Materia, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @Column({ nullable: true })
  materiaId: number;

  @OneToMany(() => Comision, (comision) => comision.cursada, {
    cascade: true,
  })
  comisiones: Comision[];

  @OneToMany(() => Semana, (semana) => semana.cursada, {
    cascade: true,
  })
  semanas: Semana[];

  @OneToMany(() => CronogramaFila, (fila) => fila.cursada, { cascade: true })
  cronogramaFilas: CronogramaFila[];
}
