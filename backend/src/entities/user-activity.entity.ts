import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

export type UserActivityKind = 'page_view' | 'presence' | 'action';

@Entity('user_activity')
@Index(['userId', 'createdAt'])
@Index(['kind', 'createdAt'])
export class UserActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Usuario;

  @Column({ type: 'varchar', length: 32 })
  kind: UserActivityKind;

  @Column({ type: 'varchar', length: 180 })
  path: string;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @CreateDateColumn()
  createdAt: Date;
}
