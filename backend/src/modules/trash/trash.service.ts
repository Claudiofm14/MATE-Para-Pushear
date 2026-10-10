import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cursada, Ejercicio, Semana, Video } from '../../entities/index.entity';

export type TrashItem = {
  id: number;
  title: string;
  type: 'cursada' | 'semana' | 'video' | 'ejercicio';
  deletedAt: Date | null;
  detail?: string;
};

@Injectable()
export class TrashService {
  constructor(
    @InjectRepository(Cursada)
    private readonly cursadaRepository: Repository<Cursada>,
    @InjectRepository(Semana)
    private readonly semanaRepository: Repository<Semana>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    @InjectRepository(Ejercicio)
    private readonly ejercicioRepository: Repository<Ejercicio>,
  ) {}

  async listByMateria(materiaId: number): Promise<TrashItem[]> {
    const [cursadas, semanas, videos, ejercicios] = await Promise.all([
      this.cursadaRepository
        .createQueryBuilder('cursada')
        .withDeleted()
        .where('cursada.materiaId = :materiaId', { materiaId })
        .andWhere('cursada.deletedAt IS NOT NULL')
        .getMany(),
      this.semanaRepository
        .createQueryBuilder('semana')
        .withDeleted()
        .leftJoinAndSelect('semana.cursada', 'cursada')
        .where('cursada.materiaId = :materiaId', { materiaId })
        .andWhere('semana.deletedAt IS NOT NULL')
        .getMany(),
      this.videoRepository
        .createQueryBuilder('video')
        .withDeleted()
        .leftJoinAndSelect('video.materia', 'materia')
        .leftJoinAndSelect('video.semana', 'semana')
        .leftJoinAndSelect('semana.cursada', 'cursada')
        .where('(materia.id = :materiaId OR cursada.materiaId = :materiaId)', {
          materiaId,
        })
        .andWhere('video.deletedAt IS NOT NULL')
        .getMany(),
      this.ejercicioRepository
        .createQueryBuilder('ejercicio')
        .withDeleted()
        .leftJoinAndSelect('ejercicio.semana', 'semana')
        .leftJoinAndSelect('semana.cursada', 'cursada')
        .where('cursada.materiaId = :materiaId', { materiaId })
        .andWhere('ejercicio.deletedAt IS NOT NULL')
        .getMany(),
    ]);

    return [
      ...cursadas.map((item) => ({
        id: item.id,
        title: item.titulo,
        type: 'cursada' as const,
        deletedAt: item.deletedAt,
        detail: item.descripcion,
      })),
      ...semanas.map((item) => ({
        id: item.id,
        title: item.titulo,
        type: 'semana' as const,
        deletedAt: item.deletedAt,
        detail: `Semana ${item.numeroSemana}`,
      })),
      ...videos.map((item) => ({
        id: item.id,
        title: item.titulo,
        type: 'video' as const,
        deletedAt: item.deletedAt,
        detail: item.subtitulo,
      })),
      ...ejercicios.map((item) => ({
        id: item.id,
        title: item.titulo,
        type: 'ejercicio' as const,
        deletedAt: item.deletedAt,
        detail: item.descripcion,
      })),
    ].sort(
      (a, b) => (b.deletedAt?.getTime() || 0) - (a.deletedAt?.getTime() || 0),
    );
  }

  async restore(type: TrashItem['type'], id: number) {
    const repository = this.getRepository(type);
    const item = await repository.findOne({
      where: { id } as any,
      withDeleted: true,
    });
    if (!item) throw new NotFoundException('Elemento no encontrado');
    await repository.restore(id);
    return { message: 'Elemento restaurado exitosamente' };
  }

  private getRepository(type: TrashItem['type']): Repository<any> {
    if (type === 'cursada') return this.cursadaRepository;
    if (type === 'semana') return this.semanaRepository;
    if (type === 'video') return this.videoRepository;
    return this.ejercicioRepository;
  }
}
