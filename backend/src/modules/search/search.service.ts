import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import {
  AlumnoMateria,
  Ejercicio,
  MaterialAcademico,
  Materia,
  ProfesorMateria,
  Semana,
  Usuario,
  Video,
} from '../../entities/index.entity';
import { USER_ROLES } from '../../auth/constants/roles.constant';

export type SearchResult = {
  id: string;
  title: string;
  detail?: string;
  type: 'materia' | 'material' | 'semana' | 'video' | 'ejercicio';
  href: string;
};

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Materia)
    private readonly materiaRepository: Repository<Materia>,
    @InjectRepository(MaterialAcademico)
    private readonly materialRepository: Repository<MaterialAcademico>,
    @InjectRepository(Semana)
    private readonly semanaRepository: Repository<Semana>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    @InjectRepository(Ejercicio)
    private readonly ejercicioRepository: Repository<Ejercicio>,
    @InjectRepository(ProfesorMateria)
    private readonly profesorMateriaRepository: Repository<ProfesorMateria>,
    @InjectRepository(AlumnoMateria)
    private readonly alumnoMateriaRepository: Repository<AlumnoMateria>,
  ) {}

  async search(
    usuario: Usuario,
    query: string,
    roles: string[] = [],
  ): Promise<SearchResult[]> {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) return [];

    const materiaIds = await this.getVisibleMateriaIds(usuario, roles);

    const like = `%${normalizedQuery}%`;
    const publicMaterias = await this.materiaRepository.find({
      where: [
        { nombre: ILike(like), archivada: false },
        { codigo: ILike(like), archivada: false },
      ],
      take: 10,
    });

    if (materiaIds.length === 0) {
      return this.mapMateriaResults(publicMaterias);
    }

    const [materiales, semanas, videos, ejercicios] = await Promise.all([
      this.materialRepository.find({
        where: [
          { materiaId: In(materiaIds), titulo: ILike(like), visible: true },
          {
            materiaId: In(materiaIds),
            descripcion: ILike(like),
            visible: true,
          },
          {
            materiaId: In(materiaIds),
            categoria: ILike(like),
            visible: true,
          },
        ],
        take: 10,
      }),
      this.semanaRepository.find({
        where: [
          { cursada: { materiaId: In(materiaIds) }, titulo: ILike(like) },
          {
            cursada: { materiaId: In(materiaIds) },
            descripcion: ILike(like),
          },
        ],
        relations: ['cursada'],
        take: 10,
      }),
      this.videoRepository.find({
        where: [
          { materia: { id: In(materiaIds) }, titulo: ILike(like) },
          { materia: { id: In(materiaIds) }, subtitulo: ILike(like) },
          {
            semana: { cursada: { materiaId: In(materiaIds) } },
            titulo: ILike(like),
          },
        ],
        relations: ['materia', 'semana', 'semana.cursada'],
        take: 10,
      }),
      this.ejercicioRepository.find({
        where: [
          {
            semana: { cursada: { materiaId: In(materiaIds) } },
            titulo: ILike(like),
          },
          {
            semana: { cursada: { materiaId: In(materiaIds) } },
            descripcion: ILike(like),
          },
        ],
        relations: ['semana', 'semana.cursada'],
        take: 10,
      }),
    ]);

    return [
      ...this.mapMateriaResults(publicMaterias),
      ...materiales.map((material) => ({
        id: `material-${material.id}`,
        title: material.titulo,
        detail: material.categoria || material.descripcion || 'Material',
        type: 'material' as const,
        href: `/materia/${material.materiaId}/material?scrollTo=${material.id}`,
      })),
      ...semanas.map((semana) => ({
        id: `semana-${semana.id}`,
        title: semana.titulo,
        detail: `Semana ${semana.numeroSemana}`,
        type: 'semana' as const,
        href: `/materia/${semana.cursada.materiaId}/semanas/${semana.id}`,
      })),
      ...videos.map((video) => {
        const materiaId = video.materia?.id || video.semana?.cursada?.materiaId;
        return {
          id: `video-${video.id}`,
          title: video.titulo,
          detail: video.subtitulo || 'Video',
          type: 'video' as const,
          href: materiaId ? `/materia/${materiaId}/videos` : '/materias',
        };
      }),
      ...ejercicios.map((ejercicio) => ({
        id: `ejercicio-${ejercicio.id}`,
        title: ejercicio.titulo,
        detail: ejercicio.descripcion,
        type: 'ejercicio' as const,
        href: ejercicio.semana?.cursada?.materiaId
          ? `/materia/${ejercicio.semana.cursada.materiaId}/semanas/${ejercicio.semana.id}`
          : '/materias',
      })),
    ].slice(0, 30);
  }

  private mapMateriaResults(materias: Materia[]): SearchResult[] {
    return materias.map((materia) => ({
      id: `materia-${materia.id}`,
      title: materia.nombre,
      detail: materia.codigo,
      type: 'materia' as const,
      href: `/materia/${materia.id}`,
    }));
  }

  private async getVisibleMateriaIds(
    usuario: Usuario,
    roles: string[] = [],
  ): Promise<number[]> {
    if (roles.includes(USER_ROLES.ADMIN) || usuario.rol === USER_ROLES.ADMIN) {
      const materias = await this.materiaRepository.find({
        where: { archivada: false },
        select: ['id'],
      });
      return materias.map((materia) => materia.id);
    }

    if (
      roles.includes(USER_ROLES.DOCENTE) ||
      usuario.rol === USER_ROLES.DOCENTE
    ) {
      const materias = await this.profesorMateriaRepository.find({
        where: { profesorId: usuario.id, materia: { archivada: false } },
        select: ['materiaId'],
      });
      return materias.map((item) => item.materiaId);
    }

    const materias = await this.alumnoMateriaRepository.find({
      where: {
        alumnoId: usuario.id,
        estado: 'aprobado',
        materia: { archivada: false },
      },
      select: ['materiaId'],
    });
    return materias.map((item) => item.materiaId);
  }
}
