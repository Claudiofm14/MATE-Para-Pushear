import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ContratoPedagogico } from './contrato_pedagogico.entity';
import { Contenedor } from './contenedor.entity';
import { ConFecha } from './conFecha.abstract.entity';

@Entity('contrato_pedagogico_contenedor')
export class ContratoPedagogicoContenedor extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ContratoPedagogico, (contrato) => contrato.contenedores, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'contrato_pedagogico_id' })
  contratoPedagogico: ContratoPedagogico;

  @ManyToOne(() => Contenedor, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'contenedor_id' })
  contenedor: Contenedor;
}
