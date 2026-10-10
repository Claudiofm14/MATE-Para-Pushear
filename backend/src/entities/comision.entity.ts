import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Cursada } from './cursada.entity';
import { Semana } from './semana.entity';
import { Actividad } from './actividad.entity';

@Entity()
export class Comision extends ConFecha {
  @ApiProperty({
    description: 'ID único de la comisión',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nombre de la comisión',
    example: 'Comisión A - Lunes',
  })
  @Column({ length: 100 })
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la comisión',
    example: 'Comisión de lunes y miércoles de 18 a 20hs',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToOne(() => Cursada, (cursada) => cursada.comisiones, {
    onDelete: 'CASCADE',
  })
  cursada: Cursada;

  @ManyToMany(() => Semana, (semana) => semana.comisiones)
  semanas: Semana[];

  @ManyToMany(() => Actividad, (actividad) => actividad.comisiones)
  actividades: Actividad[];
}
