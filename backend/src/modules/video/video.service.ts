import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../../entities/video.entity';
import { Semana } from '../../entities/semana.entity';
import { Materia } from '../../entities/materia.entity';
import { CreateVideoDto, UpdateVideoDto } from './dto/video.dto';
import {
  YoutubePlaylistService,
  YoutubePlaylistVideos,
} from './youtube-playlist.service';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(Semana)
    private semanaRepository: Repository<Semana>,
    @InjectRepository(Materia)
    private materiaRepository: Repository<Materia>,
    private readonly youtubePlaylistService: YoutubePlaylistService,
  ) {}

  async findAll(): Promise<Video[]> {
    return await this.videoRepository.find({
      relations: ['semana', 'materia'],
    });
  }

  async findOne(id: number): Promise<Video> {
    const video = await this.videoRepository.findOne({
      where: { id },
      relations: [
        'semana',
        'semana.cursada',
        'semana.cursada.materia',
        'materia',
      ],
      withDeleted: true,
    });

    if (!video) {
      throw new NotFoundException(`Video con ID ${id} no encontrado`);
    }

    return video;
  }

  async findBySemana(semanaId: number): Promise<Video[]> {
    return await this.videoRepository.find({
      where: { semana: { id: semanaId } },
      relations: ['semana'],
    });
  }

  async getPlaylistVideos(video: Video): Promise<YoutubePlaylistVideos> {
    if (video.deletedAt) {
      throw new NotFoundException('La playlist fue eliminada.');
    }
    return this.youtubePlaylistService.getVideos(video.url);
  }

  async findByMateria(materiaId: number): Promise<Video[]> {
    // Buscar videos vinculados a la materia directamente O a través de semanas de cursadas de esa materia
    return await this.videoRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.semana', 'semana')
      .leftJoinAndSelect('semana.cursada', 'cursada')
      .leftJoinAndSelect('cursada.materia', 'materiaSemana')
      .leftJoinAndSelect('video.materia', 'materiaDirecta')
      .where('materiaSemana.id = :materiaId', { materiaId })
      .orWhere('materiaDirecta.id = :materiaId', { materiaId })
      .getMany();
  }

  async create(createVideoDto: CreateVideoDto): Promise<Video> {
    let semana: Semana | null = null;
    let materia: Materia | null = null;

    if (createVideoDto.semanaId) {
      semana = await this.semanaRepository.findOne({
        where: { id: createVideoDto.semanaId },
      });

      if (!semana) {
        throw new NotFoundException(
          `Semana con ID ${createVideoDto.semanaId} no encontrada`,
        );
      }
    }

    if (createVideoDto.materiaId) {
      materia = await this.materiaRepository.findOne({
        where: { id: createVideoDto.materiaId },
      });

      if (!materia) {
        throw new NotFoundException(
          `Materia con ID ${createVideoDto.materiaId} no encontrada`,
        );
      }
    }

    const video = this.videoRepository.create({
      titulo: createVideoDto.titulo,
      subtitulo: createVideoDto.subtitulo,
      url: createVideoDto.url,
      orden: createVideoDto.orden,
      semana: semana || undefined,
      materia: materia || undefined,
    });

    return await this.videoRepository.save(video);
  }

  async update(id: number, updateVideoDto: UpdateVideoDto): Promise<Video> {
    const video = await this.findOne(id);

    if (updateVideoDto.semanaId) {
      const semana = await this.semanaRepository.findOne({
        where: { id: updateVideoDto.semanaId },
      });

      if (!semana) {
        throw new NotFoundException(
          `Semana con ID ${updateVideoDto.semanaId} no encontrada`,
        );
      }

      video.semana = semana;
      video.materia = null as any; // Si se asigna a semana, desvincular de materia directa (opcional, depende de lógica de negocio)
      // Decisión: Permitir ambos o priorizar uno?
      // Si el usuario asigna semana, asumimos que es de semana.
      // Si el usuario asigna materia, asumimos que es general.
      // Vamos a limpiar el otro campo para evitar ambigüedades, o permitir ambos si se desea.
      // Por ahora, si se asigna semana, limpiamos materiaId si estaba seteado, para mantener consistencia.
    } else if (updateVideoDto.semanaId === null) {
      video.semana = null as any;
    }

    if (updateVideoDto.materiaId) {
      const materia = await this.materiaRepository.findOne({
        where: { id: updateVideoDto.materiaId },
      });

      if (!materia) {
        throw new NotFoundException(
          `Materia con ID ${updateVideoDto.materiaId} no encontrada`,
        );
      }

      video.materia = materia;
      // Si se asigna materia directa, ¿desvinculamos de semana?
      // Si es "general", no debería tener semana.
      if (!updateVideoDto.semanaId) {
        video.semana = null as any;
      }
    } else if (updateVideoDto.materiaId === null) {
      video.materia = null as any;
    }

    if (updateVideoDto.titulo) {
      video.titulo = updateVideoDto.titulo;
    }

    if (updateVideoDto.subtitulo !== undefined) {
      video.subtitulo = updateVideoDto.subtitulo;
    }

    if (updateVideoDto.url) {
      video.url = updateVideoDto.url;
    }

    if (updateVideoDto.orden !== undefined) {
      video.orden = updateVideoDto.orden;
    }

    return await this.videoRepository.save(video);
  }

  async remove(id: number): Promise<void> {
    const video = await this.findOne(id);
    await this.videoRepository.softRemove(video);
  }

  async restore(id: number): Promise<Video> {
    const video = await this.findOne(id);

    if (!video.deletedAt) {
      throw new ConflictException(`Video con ID ${id} no está eliminado`);
    }

    await this.videoRepository.restore(id);
    return this.findOne(id);
  }
}
