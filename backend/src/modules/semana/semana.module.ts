import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemanaController } from './semana.controller';
import { SemanaPreviewController } from './semana-preview.controller';
import { SemanaService } from './semana.service';
import { Semana } from '../../entities/semana.entity';
import { Cursada } from '../../entities/cursada.entity';
import { Comision } from '../../entities/comision.entity';
import { Ejercicio } from '../../entities/ejercicio.entity';
import { Horario } from '../../entities/horario.entity';
import { Video } from '../../entities/video.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { CursadaModule } from '../cursada/cursada.module';
import { MateriaLogModule } from '../materia-log/materia-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Semana,
      Cursada,
      Comision,
      Ejercicio,
      Horario,
      Video,
    ]),
    UsuarioModule,
    CursadaModule,
    MateriaLogModule,
  ],
  controllers: [SemanaController, SemanaPreviewController],
  providers: [SemanaService],
  exports: [SemanaService],
})
export class SemanaModule {}
