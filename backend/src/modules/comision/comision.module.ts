import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComisionController } from './comision.controller';
import { ComisionService } from './comision.service';
import { Comision } from '../../entities/comision.entity';
import { Cursada } from '../../entities/cursada.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { CursadaModule } from '../cursada/cursada.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comision, Cursada]),
    UsuarioModule,
    CursadaModule,
  ],
  controllers: [ComisionController],
  providers: [ComisionService],
  exports: [ComisionService],
})
export class ComisionModule {}
