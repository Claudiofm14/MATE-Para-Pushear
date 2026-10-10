import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AdminAuditLog,
  Actividad,
  AlumnoMateria,
  Cursada,
  Ejercicio,
  EntregaActividad,
  Materia,
  MateriaLog,
  ProfesorMateria,
  Semana,
  SolicitudAccesoMateria,
  Usuario,
} from '../../entities/index.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Actividad,
      AdminAuditLog,
      AlumnoMateria,
      Cursada,
      Ejercicio,
      EntregaActividad,
      Materia,
      MateriaLog,
      ProfesorMateria,
      Semana,
      SolicitudAccesoMateria,
      Usuario,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
