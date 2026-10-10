import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AdjuntoSoporte,
  MensajeSoporte,
  ReporteSoporte,
} from '../../entities/index.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { SoporteController } from './soporte.controller';
import { SoporteService } from './soporte.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReporteSoporte, MensajeSoporte, AdjuntoSoporte]),
    UsuarioModule,
  ],
  controllers: [SoporteController],
  providers: [SoporteService],
  exports: [SoporteService],
})
export class SoporteModule {}
