import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { Comision } from '../../entities/comision.entity';
import { CronogramaFila } from '../../entities/cronograma-fila.entity';
import { Cursada } from '../../entities/cursada.entity';
import { MateriaLogModule } from '../materia-log/materia-log.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { CronogramaController } from './cronograma.controller';
import { CronogramaService } from './cronograma.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CronogramaFila,
      Cursada,
      Comision,
      AlumnoMateria,
    ]),
    UsuarioModule,
    MateriaLogModule,
  ],
  controllers: [CronogramaController],
  providers: [CronogramaService],
  exports: [CronogramaService],
})
export class CronogramaModule {}
