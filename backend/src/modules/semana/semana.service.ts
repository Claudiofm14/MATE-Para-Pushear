import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Semana } from '../../entities/semana.entity';
import { Cursada } from '../../entities/cursada.entity';
import { Comision } from '../../entities/comision.entity';
import { Ejercicio } from '../../entities/ejercicio.entity';
import { Horario } from '../../entities/horario.entity';
import { Video } from '../../entities/video.entity';
import { CreateSemanaDto, UpdateSemanaDto } from './dto/semana.dto';
import { getArgentinaDateString } from '../../config/timezone.config';

@Injectable()
export class SemanaService {
  constructor(
    @InjectRepository(Semana)
    private semanaRepository: Repository<Semana>,
    @InjectRepository(Cursada)
    private cursadaRepository: Repository<Cursada>,
    @InjectRepository(Comision)
    private comisionRepository: Repository<Comision>,
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(Ejercicio)
    private ejercicioRepository: Repository<Ejercicio>,
    @InjectRepository(Horario)
    private horarioRepository: Repository<Horario>,
  ) {}

  async findAll(): Promise<Semana[]> {
    return await this.semanaRepository.find({
      relations: ['cursada', 'comisiones', 'videos', 'ejercicios', 'horarios'],
    });
  }

  async findOne(id: number): Promise<Semana> {
    const semana = await this.semanaRepository.findOne({
      where: { id },
      // Solo relaciones "to-one" (o una unica coleccion, comisiones) aca.
      // videos/ejercicios/horarios se traen aparte: pedirlas todas juntas
      // con `relations` genera un LEFT JOIN plano entre las tres, y
      // Postgres devuelve el producto cartesiano (5 videos x 8 ejercicios x
      // 3 horarios = 120 filas para reconstruir una sola semana). Con
      // contenido real esto se nota; separado en 3 queries en paralelo el
      // costo crece de forma lineal, no multiplicativa.
      relations: ['cursada', 'cursada.materia', 'comisiones'],
      withDeleted: true,
    });

    if (!semana) {
      throw new NotFoundException(`Semana con ID ${id} no encontrada`);
    }

    const [videos, ejercicios, horarios] = await Promise.all([
      this.videoRepository.find({
        where: { semana: { id } },
        order: { orden: 'ASC' },
      }),
      this.ejercicioRepository.find({
        where: { semana: { id } },
        order: { id: 'ASC' },
      }),
      this.horarioRepository.find({
        where: { semana: { id } },
        order: { orden: 'ASC', id: 'ASC' },
      }),
    ]);
    semana.videos = videos;
    semana.ejercicios = ejercicios;
    semana.horarios = horarios;

    return semana;
  }

  async findPublicPreview(materiaId: number, semanaId: number) {
    const preview = await this.semanaRepository
      .createQueryBuilder('semana')
      .innerJoin('semana.cursada', 'cursada')
      .innerJoin('cursada.materia', 'materia')
      .select('semana.id', 'semanaId')
      .addSelect('semana.titulo', 'semanaTitulo')
      .addSelect('semana.descripcion', 'semanaDescripcion')
      .addSelect('semana.numeroSemana', 'numeroSemana')
      .addSelect('materia.id', 'materiaId')
      .addSelect('materia.nombre', 'materiaNombre')
      .where('semana.id = :semanaId', { semanaId })
      .andWhere('materia.id = :materiaId', { materiaId })
      .andWhere('semana.fechaInicio <= :today', {
        today: getArgentinaDateString(),
      })
      .getRawOne<{
        semanaId: number;
        semanaTitulo: string;
        semanaDescripcion: string | null;
        numeroSemana: number;
        materiaId: number;
        materiaNombre: string;
      }>();

    if (!preview) {
      throw new NotFoundException('Vista previa de semana no encontrada');
    }

    return preview;
  }

  async findByCursada(cursadaId: number): Promise<Semana[]> {
    return this.findSummaries({ cursadaId });
  }

  async findByComision(comisionId: number): Promise<Semana[]> {
    return this.findSummaries({ comisionId });
  }

  private async findSummaries(filters: {
    cursadaId?: number;
    comisionId?: number;
    visibleUntil?: string;
  }): Promise<Semana[]> {
    const query = this.semanaRepository
      .createQueryBuilder('semana')
      .leftJoin('semana.cursada', 'cursada')
      .leftJoin('semana.comisiones', 'comision')
      .select([
        'semana.id',
        'semana.titulo',
        'semana.descripcion',
        'semana.numeroSemana',
        'semana.fechaInicio',
        'semana.horaInicio',
        'semana.fechasClasePorComision',
        'semana.importante',
        'semana.cursadaId',
        'cursada.id',
        'cursada.titulo',
        'cursada.materiaId',
        'comision.id',
        'comision.nombre',
      ])
      .orderBy('semana.numeroSemana', 'DESC');

    if (filters.cursadaId) {
      query.andWhere('semana.cursadaId = :cursadaId', {
        cursadaId: filters.cursadaId,
      });
    }
    if (filters.comisionId) {
      query.andWhere('comision.id = :comisionId', {
        comisionId: filters.comisionId,
      });
    }
    if (filters.visibleUntil) {
      query.andWhere('semana.fechaInicio <= :visibleUntil', {
        visibleUntil: filters.visibleUntil,
      });
    }

    return query.getMany();
  }

  async create(createSemanaDto: CreateSemanaDto): Promise<Semana> {
    const cursada = await this.cursadaRepository.findOne({
      where: { id: createSemanaDto.cursadaId },
      relations: ['comisiones'],
    });

    if (!cursada) {
      throw new NotFoundException(
        `Cursada con ID ${createSemanaDto.cursadaId} no encontrada`,
      );
    }

    let comisiones: Comision[] = [];

    // Si se especifican comisiones, usar esas, sino asignar a todas las de la cursada
    if (createSemanaDto.comisionIds && createSemanaDto.comisionIds.length > 0) {
      comisiones = await this.comisionRepository.find({
        where: {
          id: In(createSemanaDto.comisionIds),
          cursada: { id: cursada.id },
        },
      });

      if (comisiones.length !== createSemanaDto.comisionIds.length) {
        throw new NotFoundException(
          'Una o más comisiones no fueron encontradas o no pertenecen a la cursada',
        );
      }
    } else {
      // Asignar a todas las comisiones de la cursada
      comisiones = cursada.comisiones;
    }

    // Crear fecha sin conversión de zona horaria
    // Si el string es "2025-11-24", mantenerlo como tal sin UTC
    const [year, month, day] = createSemanaDto.fechaInicio
      .split('-')
      .map(Number);
    const fechaInicio = new Date(year, month - 1, day);

    const semana = this.semanaRepository.create({
      titulo: createSemanaDto.titulo,
      descripcion: createSemanaDto.descripcion,
      numeroSemana: createSemanaDto.numeroSemana,
      fechaInicio,
      horaInicio: '00:00',
      importante: createSemanaDto.importante,
      avisos: createSemanaDto.avisos,
      contenido: createSemanaDto.contenido,
      fechasClasePorComision: createSemanaDto.fechasClasePorComision || null,
      cursada,
      comisiones,
    });

    return await this.semanaRepository.save(semana);
  }

  async update(id: number, updateSemanaDto: UpdateSemanaDto): Promise<Semana> {
    const semana = await this.findOne(id);

    if (updateSemanaDto.cursadaId) {
      const cursada = await this.cursadaRepository.findOne({
        where: { id: updateSemanaDto.cursadaId },
      });

      if (!cursada) {
        throw new NotFoundException(
          `Cursada con ID ${updateSemanaDto.cursadaId} no encontrada`,
        );
      }

      semana.cursada = cursada;
    }

    if (updateSemanaDto.comisionIds) {
      const comisiones = await this.comisionRepository.find({
        where: {
          id: In(updateSemanaDto.comisionIds),
        },
      });

      if (comisiones.length !== updateSemanaDto.comisionIds.length) {
        throw new NotFoundException(
          'Una o más comisiones no fueron encontradas',
        );
      }

      semana.comisiones = comisiones;
    }

    // Actualizar campos básicos
    if (updateSemanaDto.titulo !== undefined) {
      semana.titulo = updateSemanaDto.titulo;
    }
    if (updateSemanaDto.descripcion !== undefined) {
      semana.descripcion = updateSemanaDto.descripcion;
    }
    if (updateSemanaDto.numeroSemana !== undefined) {
      semana.numeroSemana = updateSemanaDto.numeroSemana;
    }
    if (updateSemanaDto.fechaInicio) {
      // Parsear sin conversión de zona horaria
      const [year, month, day] = updateSemanaDto.fechaInicio
        .split('-')
        .map(Number);
      semana.fechaInicio = new Date(year, month - 1, day);
    }
    if (updateSemanaDto.horaInicio !== undefined) {
      semana.horaInicio = '00:00';
    }
    if (updateSemanaDto.importante !== undefined) {
      semana.importante = updateSemanaDto.importante;
    }
    if (updateSemanaDto.avisos !== undefined) {
      semana.avisos = updateSemanaDto.avisos;
    }
    if (updateSemanaDto.contenido !== undefined) {
      semana.contenido = updateSemanaDto.contenido;
    }
    if (updateSemanaDto.fechasClasePorComision !== undefined) {
      semana.fechasClasePorComision =
        updateSemanaDto.fechasClasePorComision || null;
    }

    semana.horaInicio = '00:00';

    return await this.semanaRepository.save(semana);
  }

  async remove(id: number): Promise<void> {
    const semana = await this.findOne(id);
    await this.semanaRepository.softRemove(semana);
  }

  async restore(id: number): Promise<Semana> {
    const semana = await this.findOne(id);

    if (!semana.deletedAt) {
      throw new ConflictException(`Semana con ID ${id} no está eliminada`);
    }

    await this.semanaRepository.restore(id);
    return this.findOne(id);
  }

  async duplicate(id: number): Promise<Semana> {
    const original = await this.findOne(id);

    const nuevaSemana = await this.semanaRepository.save(
      this.semanaRepository.create({
        titulo: `${original.titulo} (copia)`,
        descripcion: original.descripcion,
        numeroSemana: original.numeroSemana + 1,
        fechaInicio: original.fechaInicio,
        horaInicio: original.horaInicio,
        importante: original.importante,
        avisos: original.avisos,
        contenido: original.contenido,
        fechasClasePorComision: original.fechasClasePorComision,
        cursada: original.cursada,
        cursadaId: original.cursadaId,
        comisiones: original.comisiones || [],
      }),
    );

    for (const video of original.videos || []) {
      await this.videoRepository.save(
        this.videoRepository.create({
          titulo: video.titulo,
          url: video.url,
          subtitulo: video.subtitulo,
          orden: video.orden,
          semana: nuevaSemana,
        }),
      );
    }

    for (const ejercicio of original.ejercicios || []) {
      await this.ejercicioRepository.save(
        this.ejercicioRepository.create({
          titulo: ejercicio.titulo,
          descripcion: ejercicio.descripcion,
          url: ejercicio.url,
          repositorioEjemplo: ejercicio.repositorioEjemplo,
          readmeUrl: ejercicio.readmeUrl,
          classroomUrl: ejercicio.classroomUrl,
          tipoActividad: ejercicio.tipoActividad,
          recursoTipo: ejercicio.recursoTipo,
          recursoUrl: ejercicio.recursoUrl,
          recursoTitulo: ejercicio.recursoTitulo,
          fechaEntrega: ejercicio.fechaEntrega,
          giteaTemplateOwner: ejercicio.giteaTemplateOwner,
          giteaTemplateRepo: ejercicio.giteaTemplateRepo,
          giteaTemplateRepoId: ejercicio.giteaTemplateRepoId,
          giteaTemplateCloneUrl: ejercicio.giteaTemplateCloneUrl,
          giteaAutoCreateRepo: ejercicio.giteaAutoCreateRepo,
          semana: nuevaSemana,
        }),
      );
    }

    for (const horario of original.horarios || []) {
      await this.horarioRepository.save(
        this.horarioRepository.create({
          titulo: horario.titulo,
          tipo: horario.tipo,
          detalle: horario.detalle,
          url: horario.url,
          orden: horario.orden,
          semana: nuevaSemana,
        }),
      );
    }

    return this.findOne(nuevaSemana.id);
  }

  /**
   * Obtiene las semanas visibles para un alumno específico
   * Filtra por:
   * - Semanas de la cursada
   * - Semanas de la comisión del alumno
   * - Semanas que ya hayan llegado a su fecha/hora de publicación
   */
  async findVisiblesParaAlumno(
    cursadaId: number,
    comisionId: number,
  ): Promise<Semana[]> {
    const fechaActual = getArgentinaDateString();

    return this.findSummaries({
      cursadaId,
      comisionId,
      visibleUntil: fechaActual,
    });
  }
}
