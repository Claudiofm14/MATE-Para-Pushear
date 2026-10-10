import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { InicioContenedor } from './inicio-contenedor.entity';
import { ConFecha } from './conFecha.abstract.entity';
import { Materia } from './materia.entity';

@Entity('inicio')
export class Inicio extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'json', nullable: true })
  contenido: any;

  @OneToMany(
    () => InicioContenedor,
    (inicioContenedor) => inicioContenedor.inicio,
    {
      cascade: true,
    },
  )
  contenedores: InicioContenedor[];

  @ManyToOne(() => Materia, (materia) => materia.inicios, {
    onDelete: 'CASCADE',
  })
  materia: Materia;
}
