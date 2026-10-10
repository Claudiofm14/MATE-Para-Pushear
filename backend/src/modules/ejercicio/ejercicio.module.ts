import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EjercicioController } from './ejercicio.controller';
import { EjercicioService } from './ejercicio.service';
import { Ejercicio } from '../../entities/ejercicio.entity';
import { Semana } from '../../entities/semana.entity';
import { StudentExerciseRepository } from '../../entities/student-exercise-repository.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { SemanaModule } from '../semana/semana.module';
import {
  ExerciseGroup,
  ExerciseGroupMember,
  GroupExerciseRepository,
  TeacherExerciseRepository,
  Usuario,
} from '../../entities/index.entity';
import { ExerciseGroupService } from './exercise-group.service';
import { ExerciseGroupController } from './exercise-group.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ejercicio,
      Semana,
      StudentExerciseRepository,
      ExerciseGroup,
      ExerciseGroupMember,
      GroupExerciseRepository,
      TeacherExerciseRepository,
      Usuario,
    ]),
    UsuarioModule,
    SemanaModule,
  ],
  controllers: [EjercicioController, ExerciseGroupController],
  providers: [EjercicioService, ExerciseGroupService],
  exports: [EjercicioService],
})
export class EjercicioModule {}
