import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ConFecha } from './conFecha.abstract.entity';

@Entity('contenedor')
export class Contenedor extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  subtitulo: string;

  @Column({ type: 'varchar', length: 50 })
  tipo: string;

  @ManyToOne(() => Contenedor, (contenedor) => contenedor.hijos, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  padre: Contenedor;

  @OneToMany(() => Contenedor, (contenedor) => contenedor.padre, {
    cascade: true,
  })
  hijos: Contenedor[];
}
