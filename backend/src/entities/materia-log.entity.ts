import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Materia } from './materia.entity';
import { Usuario } from './usuario.entity';

export enum MateriaLogAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  RESTORED = 'restored',
  ARCHIVED = 'archived',
  UNARCHIVED = 'unarchived',
  FINALIZED = 'finalized',
  CONFIG_UPDATED = 'config_updated',
  READ = 'read',
  AUTH = 'auth',
}

@Entity('materia_log')
export class MateriaLog extends ConFecha {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  materiaId: number;

  @ManyToOne(() => Materia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @Column({ nullable: true })
  usuarioId: number;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actorNombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actorEmail: string;

  @Column({ type: 'enum', enum: MateriaLogAction })
  action: MateriaLogAction;

  @Column({ type: 'varchar', length: 80 })
  resourceType: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  resourceId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  detail: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  result: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  correlationId: string;

  @Column({ type: 'jsonb', nullable: true })
  previousValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;
}
