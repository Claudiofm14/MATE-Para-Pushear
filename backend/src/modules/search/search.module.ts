import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AlumnoMateria,
  Ejercicio,
  MaterialAcademico,
  Materia,
  ProfesorMateria,
  Semana,
  Video,
} from '../../entities/index.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlumnoMateria,
      Ejercicio,
      MaterialAcademico,
      Materia,
      ProfesorMateria,
      Semana,
      Video,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
