import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioController } from './horario.controller';
import { HorarioService } from './horario.service';
import { Horario } from '../../entities/horario.entity';
import { Semana } from '../../entities/semana.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { SemanaModule } from '../semana/semana.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Horario, Semana]),
    UsuarioModule,
    SemanaModule,
  ],
  controllers: [HorarioController],
  providers: [HorarioService],
  exports: [HorarioService],
})
export class HorarioModule {}
