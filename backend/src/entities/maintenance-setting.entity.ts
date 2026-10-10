import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ConFecha } from './conFecha.abstract.entity';

@Entity('maintenance_setting')
export class MaintenanceSetting extends ConFecha {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  key: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  estimatedUntil: Date;

  @Column({ nullable: true })
  updatedById: number;
}
