import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ExerciseGroup } from './exercise-group.entity';
import { Usuario } from './usuario.entity';

@Entity('exercise_group_member')
@Unique('UQ_exercise_group_member_student_exercise', [
  'exerciseId',
  'studentId',
])
export class ExerciseGroupMember {
  @PrimaryGeneratedColumn() id: number;
  @Index() @Column() groupId: number;
  @ManyToOne(() => ExerciseGroup, (group) => group.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group: ExerciseGroup;
  @Column() exerciseId: number;
  @Index() @Column() studentId: number;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Usuario;
  @CreateDateColumn() joinedAt: Date;
}
