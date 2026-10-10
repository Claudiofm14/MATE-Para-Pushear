import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import sanitizeHtml = require('sanitize-html');
import { DataSource, Repository } from 'typeorm';
import { Comision } from '../../entities/comision.entity';
import { CronogramaFilaComision } from '../../entities/cronograma-fila-comision.entity';
import { CronogramaFila } from '../../entities/cronograma-fila.entity';
import { Cursada } from '../../entities/cursada.entity';
import {
  CreateCronogramaFilaDto,
  UpdateCronogramaFilaDto,
} from './dto/cronograma.dto';

@Injectable()
export class CronogramaService {
  constructor(
    @InjectRepository(CronogramaFila)
    private readonly filaRepository: Repository<CronogramaFila>,
    @InjectRepository(Cursada)
    private readonly cursadaRepository: Repository<Cursada>,
    @InjectRepository(Comision)
    private readonly comisionRepository: Repository<Comision>,
    private readonly dataSource: DataSource,
  ) {}

  async getCursada(id: number): Promise<Cursada> {
    const cursada = await this.cursadaRepository.findOne({
      where: { id },
      relations: ['materia', 'comisiones'],
    });
    if (!cursada)
      throw new NotFoundException(`Cursada con ID ${id} no encontrada`);
    return cursada;
  }

  async findByCursada(cursadaId: number, comisionId?: number) {
    await this.getCursada(cursadaId);
    if (comisionId) {
      await this.assertCommissionBelongsToCourse(cursadaId, comisionId);
    }
    const query = this.filaRepository
      .createQueryBuilder('fila')
      .leftJoinAndSelect('fila.comisiones', 'asignacion')
      .leftJoinAndSelect('asignacion.comision', 'comision')
      .where('fila.cursadaId = :cursadaId', { cursadaId })
      .orderBy('fila.numeroSemana', 'ASC')
      .addOrderBy('fila.fecha', 'ASC')
      .addOrderBy('fila.hora', 'ASC', 'NULLS FIRST')
      .addOrderBy('fila.id', 'ASC');
    if (comisionId) {
      query.andWhere(
        `EXISTS (SELECT 1 FROM "cronograma_fila_comision" filtro WHERE filtro."cronogramaFilaId" = fila.id AND filtro."comisionId" = :comisionId)`,
        { comisionId },
      );
    }
    const filas = await query.getMany();
    return comisionId
      ? filas.map((fila) => ({
          ...fila,
          comisiones: fila.comisiones.filter(
            (item) => item.comisionId === comisionId,
          ),
        }))
      : filas;
  }

  async assertCommissionBelongsToCourse(
    cursadaId: number,
    comisionId: number,
  ): Promise<void> {
    const belongs = await this.comisionRepository
      .createQueryBuilder('comision')
      .innerJoin('comision.cursada', 'cursada')
      .where('comision.id = :comisionId', { comisionId })
      .andWhere('cursada.id = :cursadaId', { cursadaId })
      .getCount();
    if (!belongs) {
      throw new BadRequestException(
        'La comision seleccionada no pertenece a la cursada',
      );
    }
  }

  async findOne(id: number): Promise<CronogramaFila> {
    const fila = await this.filaRepository.findOne({
      where: { id },
      relations: [
        'cursada',
        'cursada.materia',
        'comisiones',
        'comisiones.comision',
      ],
    });
    if (!fila)
      throw new NotFoundException(
        `Fila del cronograma con ID ${id} no encontrada`,
      );
    return fila;
  }

  private clean(value: string): string {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  }

  private validateDate(fecha: string) {
    const parsed = new Date(`${fecha}T00:00:00Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== fecha
    ) {
      throw new BadRequestException('La fecha no es válida');
    }
  }

  private async validateComisiones(
    cursadaId: number,
    items: { comisionId: number }[],
  ) {
    const ids = items.map((item) => item.comisionId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'Una comisión no puede repetirse en la misma fila',
      );
    }
    const count = await this.comisionRepository
      .createQueryBuilder('comision')
      .innerJoin('comision.cursada', 'cursada')
      .where('comision.id IN (:...ids)', { ids })
      .andWhere('cursada.id = :cursadaId', { cursadaId })
      .getCount();
    if (count !== ids.length) {
      throw new BadRequestException(
        'Una o más comisiones no pertenecen a la cursada',
      );
    }
  }

  async create(cursadaId: number, dto: CreateCronogramaFilaDto) {
    await this.getCursada(cursadaId);
    this.validateDate(dto.fecha);
    await this.validateComisiones(cursadaId, dto.comisiones);
    return this.dataSource.transaction(async (manager) => {
      const filaRepo = manager.getRepository(CronogramaFila);
      const relacionRepo = manager.getRepository(CronogramaFilaComision);
      const fila = await filaRepo.save(
        filaRepo.create({
          cursadaId,
          numeroSemana: dto.numeroSemana,
          fecha: dto.fecha,
          hora: dto.hora || null,
          actividades: this.clean(dto.actividades),
          temas: this.clean(dto.temas),
          tareas: this.clean(dto.tareas),
        }),
      );
      await relacionRepo.save(
        dto.comisiones.map((item) =>
          relacionRepo.create({ ...item, cronogramaFilaId: fila.id }),
        ),
      );
      return manager.getRepository(CronogramaFila).findOneOrFail({
        where: { id: fila.id },
        relations: [
          'cursada',
          'cursada.materia',
          'comisiones',
          'comisiones.comision',
        ],
      });
    });
  }

  async update(id: number, dto: UpdateCronogramaFilaDto) {
    const current = await this.findOne(id);
    const comisiones = dto.comisiones ?? current.comisiones;
    if (dto.fecha) this.validateDate(dto.fecha);
    await this.validateComisiones(current.cursadaId, comisiones);
    return this.dataSource.transaction(async (manager) => {
      const filaRepo = manager.getRepository(CronogramaFila);
      await filaRepo.save({
        ...current,
        ...(dto.numeroSemana !== undefined && {
          numeroSemana: dto.numeroSemana,
        }),
        ...(dto.fecha !== undefined && { fecha: dto.fecha }),
        ...(dto.hora !== undefined && { hora: dto.hora || null }),
        ...(dto.actividades !== undefined && {
          actividades: this.clean(dto.actividades),
        }),
        ...(dto.temas !== undefined && { temas: this.clean(dto.temas) }),
        ...(dto.tareas !== undefined && { tareas: this.clean(dto.tareas) }),
        comisiones: undefined,
      });
      if (dto.comisiones) {
        const repo = manager.getRepository(CronogramaFilaComision);
        await repo.delete({ cronogramaFilaId: id });
        await repo.save(
          dto.comisiones.map((item) =>
            repo.create({ ...item, cronogramaFilaId: id }),
          ),
        );
      }
      return manager.getRepository(CronogramaFila).findOneOrFail({
        where: { id },
        relations: [
          'cursada',
          'cursada.materia',
          'comisiones',
          'comisiones.comision',
        ],
      });
    });
  }

  async remove(id: number) {
    const fila = await this.findOne(id);
    await this.filaRepository.softRemove(fila);
    return fila;
  }
}
