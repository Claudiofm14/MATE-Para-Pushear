import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cursada, Ejercicio, Semana, Video } from '../../entities/index.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cursada, Ejercicio, Semana, Video]),
    UsuarioModule,
  ],
  controllers: [TrashController],
  providers: [TrashService],
})
export class TrashModule {}
