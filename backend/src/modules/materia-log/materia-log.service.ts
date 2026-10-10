import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MateriaLog } from '../../entities/materia-log.entity';
import {
  CreateMateriaLogDto,
  ListMateriaLogQueryDto,
} from './dto/materia-log.dto';

@Injectable()
export class MateriaLogService {
  constructor(
    @InjectRepository(MateriaLog)
    private materiaLogRepository: Repository<MateriaLog>,
  ) {}

  async create(dto: CreateMateriaLogDto): Promise<MateriaLog> {
    const log = this.materiaLogRepository.create({
      ...dto,
      metadata: this.compactValue(dto.metadata),
      newValues: this.compactValue(dto.newValues),
      previousValues: this.compactValue(dto.previousValues),
    });
    return this.materiaLogRepository.save(log);
  }

  private compactValue(value: unknown, depth = 0): any {
    if (value === undefined || value === null) return value;
    if (depth >= 6) return '[TRUNCATED_DEPTH]';
    if (typeof value === 'string') {
      return value.length > 2_000
        ? `${value.slice(0, 2_000)}...[TRUNCATED]`
        : value;
    }
    if (Array.isArray(value)) {
      return value
        .slice(0, 50)
        .map((item) => this.compactValue(item, depth + 1));
    }
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value)
          .slice(0, 50)
          .map(([key, item]) => [key, this.compactValue(item, depth + 1)]),
      );
    }
    return value;
  }

  async findByMateria(
    materiaId: number,
    query: ListMateriaLogQueryDto = {},
  ): Promise<MateriaLog[]> {
    const where: any = { materiaId };

    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.action) where.action = query.action;

    return this.materiaLogRepository.find({
      where,
      relations: ['usuario'],
      order: { createdAt: 'DESC' },
      take: 250,
    });
  }
}
