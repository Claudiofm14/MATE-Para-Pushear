import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContratoPedagogico } from '../../entities/contrato_pedagogico.entity';
import { ContratoPedagogicoContenedor } from '../../entities/contrato-pedagogico-contenedor.entity';
import { Contenedor } from '../../entities/contenedor.entity';
import { Materia } from '../../entities/materia.entity';
import { ContratoPedagogicoService } from './contrato-pedagogico.service';
import { ContratoPedagogicoController } from './contrato-pedagogico.controller';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContratoPedagogico,
      ContratoPedagogicoContenedor,
      Contenedor,
      Materia,
    ]),
    UsuarioModule,
  ],
  controllers: [ContratoPedagogicoController],
  providers: [ContratoPedagogicoService],
  exports: [ContratoPedagogicoService],
})
export class ContratoPedagogicoModule {}
