import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ConFecha } from './conFecha.abstract.entity';
import { Ejercicio } from './ejercicio.entity';
import { Usuario } from './usuario.entity';
import { ExerciseGroupMember } from './exercise-group-member.entity';

@Entity('exercise_group')
@Unique('UQ_exercise_group_name', ['exerciseId', 'normalizedName'])
export class ExerciseGroup extends ConFecha {
  @PrimaryGeneratedColumn() id: number;
  @Index() @Column() exerciseId: number;
  @ManyToOne(() => Ejercicio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exerciseId' })
  exercise: Ejercicio;
  @Column({ length: 100 }) name: string;
  @Column({ length: 100 }) normalizedName: string;
  @Column() createdByStudentId: number;
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByStudentId' })
  createdByStudent: Usuario;
  @Column({ default: false }) modificationsLocked: boolean;
  @OneToMany(() => ExerciseGroupMember, (member) => member.group)
  members: ExerciseGroupMember[];
}
