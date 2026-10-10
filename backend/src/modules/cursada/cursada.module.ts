import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CursadaController } from './cursada.controller';
import { CursadaService } from './cursada.service';
import { Cursada } from '../../entities/cursada.entity';
import { Materia } from '../../entities/materia.entity';
import { Comision } from '../../entities/comision.entity';
import { Ejercicio } from '../../entities/ejercicio.entity';
import { Horario } from '../../entities/horario.entity';
import { Semana } from '../../entities/semana.entity';
import { Video } from '../../entities/video.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { MateriaLogModule } from '../materia-log/materia-log.module';
import { CronogramaFila } from '../../entities/cronograma-fila.entity';
import { CronogramaFilaComision } from '../../entities/cronograma-fila-comision.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comision,
      Cursada,
      Ejercicio,
      Horario,
      Materia,
      Semana,
      Video,
      CronogramaFila,
      CronogramaFilaComision,
    ]),
    UsuarioModule,
    MateriaLogModule,
  ],
  controllers: [CursadaController],
  providers: [CursadaService],
  exports: [CursadaService],
})
export class CursadaModule {}
