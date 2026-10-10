import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
} from 'typeorm';
import { Inicio } from './inicio.entity';
import { Contenedor } from './contenedor.entity';
import { ConFecha } from './conFecha.abstract.entity';

@Entity('inicio_contenedor')
export class InicioContenedor extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Inicio, (inicio) => inicio.contenedores, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'inicio_id' })
  inicio: Inicio;

  @ManyToOne(() => Contenedor, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'contenedor_id' })
  contenedor: Contenedor;
}
