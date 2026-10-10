import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { MaterialContenedor } from './material-contenedor.entity';
import { ConFecha } from './conFecha.abstract.entity';
import { Materia } from './materia.entity';

@Entity('material')
export class Material extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @OneToMany(
    () => MaterialContenedor,
    (materialContenedor) => materialContenedor.material,
    {
      cascade: true,
    },
  )
  contenedores: MaterialContenedor[];

  @ManyToOne(() => Materia, (materia) => materia.materiales, {
    onDelete: 'CASCADE',
  })
  materia: Materia;
}
