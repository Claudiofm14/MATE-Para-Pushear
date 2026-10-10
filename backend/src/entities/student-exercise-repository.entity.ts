import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ConFecha } from './conFecha.abstract.entity';
import { Ejercicio } from './ejercicio.entity';
import { Usuario } from './usuario.entity';

@Entity('student_exercise_repository')
@Unique(['exerciseId', 'studentId'])
export class StudentExerciseRepository extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ejercicio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exerciseId' })
  exercise: Ejercicio;

  @Column()
  exerciseId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Usuario;

  @Column()
  studentId: number;

  @Column({ type: 'varchar', length: 255 })
  giteaOwnerOrg: string;

  @Column({ type: 'varchar', length: 255 })
  giteaRepoName: string;

  @Column({ type: 'varchar', length: 255 })
  giteaRepoFullName: string;

  @Column({ type: 'text' })
  giteaRepoUrl: string;

  @Column({ type: 'text', nullable: true })
  giteaCloneUrlHttp?: string;

  @Column({ type: 'text', nullable: true })
  giteaCloneUrlSsh?: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: 'pending' | 'creating' | 'created' | 'failed';

  @Column({ type: 'boolean', default: true })
  repoExists: boolean;

  @Column({ type: 'varchar', length: 32, default: 'never_synced' })
  syncStatus: 'never_synced' | 'synced' | 'failed';

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastCommitSha?: string;

  @Column({ type: 'text', nullable: true })
  lastCommitMessage?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastCommitAuthor?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastCommitAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;
}
