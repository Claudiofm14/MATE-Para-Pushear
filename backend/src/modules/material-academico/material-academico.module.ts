import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialAcademico } from '../../entities/material-academico.entity';
import { Materia } from '../../entities/materia.entity';
import { MaterialAcademicoController } from './material-academico.controller';
import { MaterialAcademicoService } from './material-academico.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { MateriaLogModule } from '../materia-log/materia-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaterialAcademico, Materia]),
    UsuarioModule,
    MateriaLogModule,
  ],
  controllers: [MaterialAcademicoController],
  providers: [MaterialAcademicoService],
  exports: [MaterialAcademicoService],
})
export class MaterialAcademicoModule {}
