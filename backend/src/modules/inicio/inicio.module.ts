import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InicioController } from './inicio.controller';
import { InicioService } from './inicio.service';
import { Inicio } from '../../entities/inicio.entity';
import { InicioContenedor } from '../../entities/inicio-contenedor.entity';
import { Contenedor } from '../../entities/contenedor.entity';
import { Materia } from '../../entities/materia.entity';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inicio, InicioContenedor, Contenedor, Materia]),
    UsuarioModule,
  ],
  controllers: [InicioController],
  providers: [InicioService],
  exports: [InicioService],
})
export class InicioModule {}
