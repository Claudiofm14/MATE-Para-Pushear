import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { Video } from '../../entities/video.entity';
import { Semana } from '../../entities/semana.entity';
import { Materia } from '../../entities/materia.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { SemanaModule } from '../semana/semana.module';
import { MateriaLogModule } from '../materia-log/materia-log.module';
import { YoutubePlaylistService } from './youtube-playlist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, Semana, Materia]),
    UsuarioModule,
    SemanaModule,
    MateriaLogModule,
  ],
  controllers: [VideoController],
  providers: [VideoService, YoutubePlaylistService],
  exports: [VideoService],
})
export class VideoModule {}
