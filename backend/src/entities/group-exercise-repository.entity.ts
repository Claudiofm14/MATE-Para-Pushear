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
import { ExerciseGroup } from './exercise-group.entity';

@Entity('group_exercise_repository')
@Unique('UQ_group_exercise_repository', ['exerciseId', 'groupId'])
export class GroupExerciseRepository extends ConFecha {
  @PrimaryGeneratedColumn() id: number;
  @Column() exerciseId: number;
  @ManyToOne(() => Ejercicio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exerciseId' })
  exercise: Ejercicio;
  @Column() groupId: number;
  @ManyToOne(() => ExerciseGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: ExerciseGroup;
  @Column({ length: 255, nullable: true }) giteaRepositoryId?: string;
  @Column({ length: 255 }) repositoryOwner: string;
  @Column({ length: 255 }) repositoryName: string;
  @Column({ type: 'text', default: '' }) repositoryUrl: string;
  @Column({ length: 16, default: 'pending' }) syncStatus:
    | 'pending'
    | 'creating'
    | 'ready'
    | 'error';
  @Column({ type: 'text', nullable: true }) sanitizedError?: string;
}
