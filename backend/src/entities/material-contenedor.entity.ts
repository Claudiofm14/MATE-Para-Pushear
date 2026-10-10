import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Material } from './material.entity';
import { Contenedor } from './contenedor.entity';
import { ConFecha } from './conFecha.abstract.entity';

@Entity('material_contenedor')
export class MaterialContenedor extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Material, (material) => material.contenedores, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => Contenedor, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'contenedor_id' })
  contenedor: Contenedor;
}
