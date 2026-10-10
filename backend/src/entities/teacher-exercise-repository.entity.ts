import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ConFecha } from './conFecha.abstract.entity';
import { Ejercicio } from './ejercicio.entity';
import { Usuario } from './usuario.entity';

@Entity('teacher_exercise_repository')
@Unique('UQ_teacher_exercise_repository_exercise_teacher', [
  'exerciseId',
  'teacherId',
])
export class TeacherExerciseRepository extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ejercicio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exerciseId' })
  exercise: Ejercicio;

  @Column()
  exerciseId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Usuario;

  @Column()
  teacherId: number;

  @Column({ type: 'varchar', length: 255 })
  giteaOwnerOrg: string;

  @Column({ type: 'varchar', length: 255 })
  giteaRepoName: string;

  @Column({ type: 'varchar', length: 255 })
  giteaRepoFullName: string;

  @Column({ type: 'text', default: '' })
  giteaRepoUrl: string;

  @Column({ type: 'text', nullable: true })
  giteaCloneUrlHttp?: string;

  @Column({ type: 'text', nullable: true })
  giteaCloneUrlSsh?: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: 'pending' | 'creating' | 'created' | 'failed';

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;
}
