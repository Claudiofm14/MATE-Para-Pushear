import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actividad } from '../../entities/actividad.entity';
import { EntregaActividad } from '../../entities/entrega-actividad.entity';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { Comision } from '../../entities/comision.entity';
import { StudentExerciseRepository } from '../../entities/student-exercise-repository.entity';
import { ActividadService } from './actividad.service';
import { EntregaActividadService } from './entrega-actividad.service';
import { ActividadController } from './actividad.controller';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Actividad,
      EntregaActividad,
      AlumnoMateria,
      Comision,
      StudentExerciseRepository,
    ]),
    UsuarioModule,
  ],
  controllers: [ActividadController],
  providers: [ActividadService, EntregaActividadService],
  exports: [ActividadService, EntregaActividadService],
})
export class ActividadModule {}
