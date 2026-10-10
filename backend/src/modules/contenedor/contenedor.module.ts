import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContenedorController } from './contenedor.controller';
import { ContenedorService } from './contenedor.service';
import { Contenedor } from '../../entities/contenedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contenedor])],
  controllers: [ContenedorController],
  providers: [ContenedorService],
  exports: [ContenedorService],
})
export class ContenedorModule {}
