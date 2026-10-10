import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { Material } from '../../entities/material.entity';
import { MaterialContenedor } from '../../entities/material-contenedor.entity';
import { Contenedor } from '../../entities/contenedor.entity';
import { Materia } from '../../entities/materia.entity';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Material,
      MaterialContenedor,
      Contenedor,
      Materia,
    ]),
    UsuarioModule,
  ],
  controllers: [MaterialController],
  providers: [MaterialService],
  exports: [MaterialService],
})
export class MaterialModule {}
