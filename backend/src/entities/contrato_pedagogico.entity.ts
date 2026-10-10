import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { ContratoPedagogicoContenedor } from './contrato-pedagogico-contenedor.entity';
import { ConFecha } from './conFecha.abstract.entity';
import { Materia } from './materia.entity';

@Entity()
export class ContratoPedagogico extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  titulo: string;

  @OneToMany(
    () => ContratoPedagogicoContenedor,
    (contratoContenedor) => contratoContenedor.contratoPedagogico,
    {
      cascade: true,
    },
  )
  contenedores: ContratoPedagogicoContenedor[];

  @ManyToOne(() => Materia, (materia) => materia.contratos, {
    onDelete: 'CASCADE',
  })
  materia: Materia;
}
