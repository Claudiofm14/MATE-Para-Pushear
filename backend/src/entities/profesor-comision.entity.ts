import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { ProfesorMateria } from './profesor-materia.entity';
import { Comision } from './comision.entity';

@Entity('profesor_comision')
export class ProfesorComision extends ConFecha {
  @ApiProperty({
    description: 'ID único de la relación profesor-comisión',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Relación profesor-materia',
    type: () => ProfesorMateria,
  })
  @ManyToOne(
    () => ProfesorMateria,
    (profesorMateria) => profesorMateria.comisiones,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'profesorMateriaId' })
  profesorMateria: ProfesorMateria;

  @Column()
  profesorMateriaId: number;

  @ApiProperty({
    description: 'Comisión asignada',
    type: () => Comision,
  })
  @ManyToOne(() => Comision, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comisionId' })
  comision: Comision;

  @Column()
  comisionId: number;
}
