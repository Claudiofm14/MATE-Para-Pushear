import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MateriaController } from './materia.controller';
import { MateriaService } from './materia.service';
import { Materia } from '../../entities/materia.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { MateriaLogModule } from '../materia-log/materia-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Materia]),
    UsuarioModule,
    MateriaLogModule,
  ],
  controllers: [MateriaController],
  providers: [MateriaService],
  exports: [MateriaService],
})
export class MateriaModule {}
