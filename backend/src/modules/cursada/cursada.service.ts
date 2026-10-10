import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Cursada } from '../../entities/cursada.entity';
import { Materia } from '../../entities/materia.entity';
import { Comision } from '../../entities/comision.entity';
import { Ejercicio } from '../../entities/ejercicio.entity';
import { Horario } from '../../entities/horario.entity';
import { Semana } from '../../entities/semana.entity';
import { Video } from '../../entities/video.entity';
import { CreateCursadaDto, UpdateCursadaDto } from './dto/cursada.dto';
import { getArgentinaDateString } from '../../config/timezone.config';
import { CronogramaFila } from '../../entities/cronograma-fila.entity';
import { CronogramaFilaComision } from '../../entities/cronograma-fila-comision.entity';

@Injectable()
export class CursadaService {
  private readonly logger = new Logger(CursadaService.name);
  private expirationCheckPromise?: Promise<void>;
  private lastExpirationCheckAt = 0;

  constructor(
    @InjectRepository(Cursada)
    private cursadaRepository: Repository<Cursada>,
    @InjectRepository(Materia)
    private materiaRepository: Repository<Materia>,
    @InjectRepository(Comision)
    private comisionRepository: Repository<Comision>,
    @InjectRepository(Semana)
    private semanaRepository: Repository<Semana>,
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(Ejercicio)
    private ejercicioRepository: Repository<Ejercicio>,
    @InjectRepository(Horario)
    private horarioRepository: Repository<Horario>,
    private dataSource: DataSource,
  ) {}

  private async pausarCursadasVencidas(): Promise<void> {
    const configuredInterval = Number(
      process.env.CURSADA_EXPIRATION_CHECK_INTERVAL_MS || 60_000,
    );
    const intervalMs = Number.isFinite(configuredInterval)
      ? Math.max(10_000, configuredInterval)
      : 60_000;
    const now = Date.now();

    if (now - this.lastExpirationCheckAt < intervalMs) return;
    if (this.expirationCheckPromise) return this.expirationCheckPromise;

    this.expirationCheckPromise = this.cursadaRepository
      .createQueryBuilder()
      .update(Cursada)
      .set({ activa: false })
      .where('"activa" = true')
      .andWhere('"fechaFin" IS NOT NULL')
      .andWhere('"fechaFin" < :fechaActual', {
        fechaActual: getArgentinaDateString(),
      })
      .execute()
      .then(() => undefined)
      .catch((error) => {
        this.logger.warn(
          `No se pudieron pausar cursadas vencidas: ${error instanceof Error ? error.message : String(error)}`,
        );
      })
      .finally(() => {
        this.lastExpirationCheckAt = Date.now();
        this.expirationCheckPromise = undefined;
      });

    return this.expirationCheckPromise;
  }

  private validarFechas(
    fechaInicio?: string | null,
    fechaFin?: string | null,
  ): void {
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser posterior a la fecha de fin',
      );
    }
  }

  private validarActivacion(fechaFin?: string | null): void {
    if (!fechaFin) return;

    if (fechaFin < getArgentinaDateString()) {
      throw new BadRequestException(
        'No se puede activar una cursada con fecha de fin vencida',
      );
    }
  }

  private async desactivarOtrasCursadas(
    materiaId: number,
    cursadaId?: number,
  ): Promise<void> {
    const query = this.cursadaRepository
      .createQueryBuilder()
      .update(Cursada)
      .set({ activa: false })
      .where('"materiaId" = :materiaId', { materiaId })
      .andWhere('"activa" = true');

    if (cursadaId) {
      query.andWhere('"id" != :cursadaId', { cursadaId });
    }

    await query.execute();
  }

  async findAll(): Promise<Cursada[]> {
    await this.pausarCursadasVencidas();
    return await this.cursadaRepository.find({
      relations: ['materia', 'comisiones', 'semanas'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Cursada> {
    const cursada = await this.cursadaRepository.findOne({
      where: { id },
      relations: ['materia', 'comisiones', 'semanas'],
      withDeleted: true,
    });

    if (!cursada) {
      throw new NotFoundException(`Cursada con ID ${id} no encontrada`);
    }

    return cursada;
  }

  async findAccessReference(id: number): Promise<Cursada> {
    const cursada = await this.cursadaRepository.findOne({
      where: { id },
      select: { id: true, materiaId: true },
      loadEagerRelations: false,
    });

    if (!cursada) {
      throw new NotFoundException(`Cursada con ID ${id} no encontrada`);
    }

    return cursada;
  }

  async findByMateria(materiaId: number): Promise<Cursada[]> {
    await this.pausarCursadasVencidas();
    return await this.cursadaRepository.find({
      where: { materia: { id: materiaId } },
      // La lista solo necesita los datos escalares de la cursada.
      // Las semanas se consultan mediante /semana/cursada/:id; incluirlas
      // aqui duplicaba el payload. Las comisiones tienen su propio endpoint.
      loadEagerRelations: false,
      order: { activa: 'DESC', id: 'DESC' },
    });
  }

  async create(createCursadaDto: CreateCursadaDto): Promise<Cursada> {
    this.validarFechas(createCursadaDto.fechaInicio, createCursadaDto.fechaFin);

    const materia = await this.materiaRepository.findOne({
      where: { id: createCursadaDto.materiaId },
    });

    if (!materia) {
      throw new NotFoundException(
        `Materia con ID ${createCursadaDto.materiaId} no encontrada`,
      );
    }

    const activa = createCursadaDto.activa ?? true;
    if (activa) {
      this.validarActivacion(createCursadaDto.fechaFin);
      await this.desactivarOtrasCursadas(materia.id);
    }

    const cursada = this.cursadaRepository.create({
      titulo: createCursadaDto.titulo,
      descripcion: createCursadaDto.descripcion,
      activa,
      fechaInicio: createCursadaDto.fechaInicio,
      fechaFin: createCursadaDto.fechaFin ?? null,
      giteaIntegrationEnabled:
        createCursadaDto.giteaIntegrationEnabled ?? false,
      giteaOrgName: createCursadaDto.giteaOrgName || null,
      giteaOrgId: createCursadaDto.giteaOrgId || null,
      giteaOrgUrl: createCursadaDto.giteaOrgUrl || null,
      materia,
      materiaId: materia.id,
    });

    return await this.cursadaRepository.save(cursada);
  }

  async update(
    id: number,
    updateCursadaDto: UpdateCursadaDto,
  ): Promise<Cursada> {
    const cursada = await this.findOne(id);
    // Con ?? un null enviado para borrar la fecha caeria en el valor viejo y
    // se validaria contra una fecha que se esta quitando.
    const fechaInicio =
      updateCursadaDto.fechaInicio !== undefined
        ? updateCursadaDto.fechaInicio
        : cursada.fechaInicio;
    const fechaFin =
      updateCursadaDto.fechaFin !== undefined
        ? updateCursadaDto.fechaFin
        : cursada.fechaFin;

    this.validarFechas(fechaInicio, fechaFin);

    if (updateCursadaDto.materiaId) {
      const materia = await this.materiaRepository.findOne({
        where: { id: updateCursadaDto.materiaId },
      });

      if (!materia) {
        throw new NotFoundException(
          `Materia con ID ${updateCursadaDto.materiaId} no encontrada`,
        );
      }

      cursada.materia = materia;
      cursada.materiaId = materia.id;
    }

    if (updateCursadaDto.titulo) {
      cursada.titulo = updateCursadaDto.titulo;
    }

    // Vacio y null significan "quitar el valor", no "dejarlo como estaba".
    if (updateCursadaDto.descripcion !== undefined) {
      cursada.descripcion = updateCursadaDto.descripcion || null;
    }

    if (updateCursadaDto.fechaInicio !== undefined) {
      cursada.fechaInicio = updateCursadaDto.fechaInicio || null;
    }

    if (updateCursadaDto.fechaFin !== undefined) {
      cursada.fechaFin = updateCursadaDto.fechaFin || null;
    }

    if (updateCursadaDto.activa !== undefined) {
      if (updateCursadaDto.activa) {
        this.validarActivacion(cursada.fechaFin);
        await this.desactivarOtrasCursadas(cursada.materia.id, cursada.id);
      }

      cursada.activa = updateCursadaDto.activa;
    }

    if (updateCursadaDto.giteaIntegrationEnabled !== undefined) {
      cursada.giteaIntegrationEnabled =
        updateCursadaDto.giteaIntegrationEnabled;
    }

    if (updateCursadaDto.giteaOrgName !== undefined) {
      cursada.giteaOrgName = updateCursadaDto.giteaOrgName || null;
    }

    if (updateCursadaDto.giteaOrgId !== undefined) {
      cursada.giteaOrgId = updateCursadaDto.giteaOrgId || null;
    }

    if (updateCursadaDto.giteaOrgUrl !== undefined) {
      cursada.giteaOrgUrl = updateCursadaDto.giteaOrgUrl || null;
    }

    return await this.cursadaRepository.save(cursada);
  }

  async remove(id: number): Promise<Cursada> {
    return this.finalizar(id);
  }

  async finalizar(id: number): Promise<Cursada> {
    const cursada = await this.findOne(id);

    cursada.activa = false;
    cursada.fechaFin = getArgentinaDateString();

    return await this.cursadaRepository.save(cursada);
  }

  async restore(id: number): Promise<Cursada> {
    const cursada = await this.findOne(id);

    if (!cursada.deletedAt) {
      throw new ConflictException(`Cursada con ID ${id} no está eliminada`);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Cursada).restore(id);

      const semanas = await manager.query(
        `SELECT "id" FROM "semana" WHERE "cursadaId" = $1`,
        [id],
      );
      const semanaIds = semanas.map((semana: { id: number }) => semana.id);

      await manager.query(
        `UPDATE "comision" SET "deletedAt" = NULL WHERE "cursadaId" = $1`,
        [id],
      );
      await manager.query(
        `UPDATE "semana" SET "deletedAt" = NULL WHERE "cursadaId" = $1`,
        [id],
      );

      if (semanaIds.length > 0) {
        await manager.query(
          `UPDATE "video" SET "deletedAt" = NULL WHERE "semanaId" = ANY($1)`,
          [semanaIds],
        );
        await manager.query(
          `UPDATE "ejercicio" SET "deletedAt" = NULL WHERE "semanaId" = ANY($1)`,
          [semanaIds],
        );
        await manager.query(
          `UPDATE "horario" SET "deletedAt" = NULL WHERE "semanaId" = ANY($1)`,
          [semanaIds],
        );
      }
    });

    return this.findOne(id);
  }

  async duplicate(id: number): Promise<Cursada> {
    const original = await this.cursadaRepository.findOne({
      where: { id },
      relations: ['materia'],
    });

    if (!original) {
      throw new NotFoundException(`Cursada con ID ${id} no encontrada`);
    }

    // Cada coleccion se trae en su propia consulta. Pedirlas todas juntas
    // en un unico `relations` (comisiones + semanas + los videos/ejercicios
    // /horarios/comisiones de cada semana + cronogramaFilas) genera un
    // LEFT JOIN plano entre colecciones hermanas: Postgres devuelve el
    // producto cartesiano entre todas ellas, no la suma. Con una cursada
    // real (varias semanas con contenido, comisiones y filas de
    // cronograma) esto se dispara a cientos de miles de filas para una
    // sola operacion de "duplicar cursada" (mismo problema resuelto en
    // semana.service.ts findOne()).
    const cronogramaFilaRepo = this.dataSource.getRepository(CronogramaFila);
    const [comisiones, semanas, cronogramaFilas] = await Promise.all([
      this.comisionRepository.find({ where: { cursada: { id } } }),
      // `comisiones` aca es la unica coleccion pedida a este nivel (no se
      // cruza con otra colección hermana), asi que no es cartesiana.
      this.semanaRepository.find({
        where: { cursadaId: id },
        relations: ['comisiones'],
      }),
      cronogramaFilaRepo.find({
        where: { cursadaId: id },
        relations: ['comisiones'],
      }),
    ]);

    const semanaIds = semanas.map((semana) => semana.id);
    // Se carga la relacion `semana` (solo su id) para poder reagrupar cada
    // item bajo la semana a la que pertenece.
    const relationSelect = () => ({
      relations: ['semana'],
      select: { semana: { id: true } },
    });
    const [videos, ejercicios, horarios] = semanaIds.length
      ? await Promise.all([
          this.videoRepository.find({
            where: { semana: { id: In(semanaIds) } },
            ...relationSelect(),
          }),
          this.ejercicioRepository.find({
            where: { semana: { id: In(semanaIds) } },
            ...relationSelect(),
          }),
          this.horarioRepository.find({
            where: { semana: { id: In(semanaIds) } },
            ...relationSelect(),
          }),
        ])
      : [[], [], []];

    const groupBySemanaId = <T extends { semana?: { id: number } }>(
      items: T[],
    ) => {
      const map = new Map<number, T[]>();
      for (const item of items) {
        const semanaId = item.semana?.id;
        if (!semanaId) continue;
        const list = map.get(semanaId) || [];
        list.push(item);
        map.set(semanaId, list);
      }
      return map;
    };
    const videosPorSemana = groupBySemanaId(videos);
    const ejerciciosPorSemana = groupBySemanaId(ejercicios);
    const horariosPorSemana = groupBySemanaId(horarios);

    return this.dataSource.transaction(async (manager) => {
      const cursadaRepo = manager.getRepository(Cursada);
      const comisionRepo = manager.getRepository(Comision);
      const semanaRepo = manager.getRepository(Semana);
      const videoRepo = manager.getRepository(Video);
      const ejercicioRepo = manager.getRepository(Ejercicio);
      const horarioRepo = manager.getRepository(Horario);
      const cronogramaRepo = manager.getRepository(CronogramaFila);
      const cronogramaComisionRepo = manager.getRepository(
        CronogramaFilaComision,
      );

      const nuevaCursada = await cursadaRepo.save(
        cursadaRepo.create({
          titulo: `${original.titulo} (copia)`,
          descripcion: original.descripcion,
          activa: false,
          fechaInicio: original.fechaInicio,
          fechaFin: original.fechaFin,
          giteaIntegrationEnabled: original.giteaIntegrationEnabled,
          giteaOrgName: original.giteaOrgName,
          giteaOrgId: original.giteaOrgId,
          giteaOrgUrl: original.giteaOrgUrl,
          materia: original.materia,
          materiaId: original.materiaId,
        }),
      );

      const comisionesPorId = new Map<number, Comision>();
      for (const comision of comisiones) {
        const nuevaComision = await comisionRepo.save(
          comisionRepo.create({
            nombre: comision.nombre,
            descripcion: comision.descripcion,
            cursada: nuevaCursada,
          }),
        );
        comisionesPorId.set(comision.id, nuevaComision);
      }

      for (const semana of semanas) {
        const nuevasComisiones =
          semana.comisiones
            ?.map((comision) => comisionesPorId.get(comision.id))
            .filter(Boolean) || [];

        const nuevaSemana = await semanaRepo.save(
          semanaRepo.create({
            titulo: semana.titulo,
            descripcion: semana.descripcion,
            numeroSemana: semana.numeroSemana,
            fechaInicio: semana.fechaInicio,
            horaInicio: semana.horaInicio,
            importante: semana.importante,
            avisos: semana.avisos,
            contenido: semana.contenido,
            fechasClasePorComision: semana.fechasClasePorComision,
            cursada: nuevaCursada,
            cursadaId: nuevaCursada.id,
            comisiones: nuevasComisiones,
          }),
        );

        for (const video of videosPorSemana.get(semana.id) || []) {
          await videoRepo.save(
            videoRepo.create({
              titulo: video.titulo,
              url: video.url,
              subtitulo: video.subtitulo,
              orden: video.orden,
              semana: nuevaSemana,
            }),
          );
        }

        for (const ejercicio of ejerciciosPorSemana.get(semana.id) || []) {
          await ejercicioRepo.save(
            ejercicioRepo.create({
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

        for (const horario of horariosPorSemana.get(semana.id) || []) {
          await horarioRepo.save(
            horarioRepo.create({
              titulo: horario.titulo,
              tipo: horario.tipo,
              detalle: horario.detalle,
              url: horario.url,
              orden: horario.orden,
              semana: nuevaSemana,
            }),
          );
        }
      }

      for (const fila of cronogramaFilas) {
        const nuevaFila = await cronogramaRepo.save(
          cronogramaRepo.create({
            cursadaId: nuevaCursada.id,
            numeroSemana: fila.numeroSemana,
            fecha: fila.fecha,
            hora: fila.hora,
            actividades: fila.actividades,
            temas: fila.temas,
            tareas: fila.tareas,
          }),
        );
        await cronogramaComisionRepo.save(
          (fila.comisiones || []).map((asignacion) => {
            const nuevaComision = comisionesPorId.get(asignacion.comisionId);
            if (!nuevaComision) {
              throw new BadRequestException(
                `No se encontró la comisión equivalente para ${asignacion.comisionId}`,
              );
            }
            return cronogramaComisionRepo.create({
              cronogramaFilaId: nuevaFila.id,
              comisionId: nuevaComision.id,
              modalidad: asignacion.modalidad,
            });
          }),
        );
      }

      return cursadaRepo.findOneOrFail({
        where: { id: nuevaCursada.id },
        relations: ['materia', 'comisiones', 'semanas'],
      });
    });
  }
}
