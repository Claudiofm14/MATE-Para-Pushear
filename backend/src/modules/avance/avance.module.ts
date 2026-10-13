import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { AvanceEjercicio } from '../../entities/avance-ejercicio.entity';
import { Comision } from '../../entities/comision.entity';
import { Cursada } from '../../entities/cursada.entity';
import { Ejercicio } from '../../entities/ejercicio.entity';
import { SemanaModule } from '../semana/semana.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { AvanceController } from './avance.controller';
import { AvanceService } from './avance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cursada,
      AlumnoMateria,
      Comision,
      Ejercicio,
      AvanceEjercicio,
    ]),
    SemanaModule,
    UsuarioModule,
  ],
  controllers: [AvanceController],
  providers: [AvanceService],
})
export class AvanceModule {}
