import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comision } from '../../entities/comision.entity';
import { Cursada } from '../../entities/cursada.entity';
import { CreateComisionDto, UpdateComisionDto } from './dto/comision.dto';

@Injectable()
export class ComisionService {
  constructor(
    @InjectRepository(Comision)
    private comisionRepository: Repository<Comision>,
    @InjectRepository(Cursada)
    private cursadaRepository: Repository<Cursada>,
  ) {}

  async findAll(soloActivas = false): Promise<Comision[]> {
    return await this.comisionRepository.find({
      where: soloActivas ? { cursada: { activa: true } } : {},
      relations: ['cursada', 'semanas'],
    });
  }

  async findOne(id: number): Promise<Comision> {
    const comision = await this.comisionRepository.findOne({
      where: { id },
      relations: ['cursada', 'cursada.materia', 'semanas'],
      withDeleted: true,
    });

    if (!comision) {
      throw new NotFoundException(`Comisión con ID ${id} no encontrada`);
    }

    return comision;
  }

  async findByCursada(cursadaId: number): Promise<Comision[]> {
    return await this.comisionRepository.find({
      where: { cursada: { id: cursadaId } },
      relations: ['cursada'],
      order: { nombre: 'ASC' },
    });
  }

  async create(createComisionDto: CreateComisionDto): Promise<Comision> {
    const cursada = await this.cursadaRepository.findOne({
      where: { id: createComisionDto.cursadaId },
    });

    if (!cursada) {
      throw new NotFoundException(
        `Cursada con ID ${createComisionDto.cursadaId} no encontrada`,
      );
    }

    const comision = this.comisionRepository.create({
      nombre: createComisionDto.nombre,
      descripcion: createComisionDto.descripcion,
      cursada,
    });

    return await this.comisionRepository.save(comision);
  }

  async update(
    id: number,
    updateComisionDto: UpdateComisionDto,
  ): Promise<Comision> {
    // NO cargar la relación 'semanas' para evitar duplicate key error
    const comision = await this.comisionRepository.findOne({
      where: { id },
      relations: ['cursada'],
    });

    if (!comision) {
      throw new NotFoundException(`Comisión con ID ${id} no encontrada`);
    }

    if (updateComisionDto.cursadaId) {
      const cursada = await this.cursadaRepository.findOne({
        where: { id: updateComisionDto.cursadaId },
      });

      if (!cursada) {
        throw new NotFoundException(
          `Cursada con ID ${updateComisionDto.cursadaId} no encontrada`,
        );
      }

      comision.cursada = cursada;
    }

    if (updateComisionDto.nombre) {
      comision.nombre = updateComisionDto.nombre;
    }

    if (updateComisionDto.descripcion !== undefined) {
      comision.descripcion = updateComisionDto.descripcion;
    }

    return await this.comisionRepository.save(comision);
  }

  async remove(id: number): Promise<void> {
    // No usamos this.findOne(id) porque carga las relaciones 'semanas'
    // y al hacer softRemove, TypeORM intenta reinsertar las relaciones ManyToMany
    // causando un error de llave duplicada.
    const comision = await this.comisionRepository.findOne({ where: { id } });

    if (!comision) {
      throw new NotFoundException(`Comisión con ID ${id} no encontrada`);
    }

    await this.comisionRepository.softRemove(comision);
  }

  async restore(id: number): Promise<Comision> {
    const comision = await this.findOne(id);

    if (!comision.deletedAt) {
      throw new ConflictException(`Comisión con ID ${id} no está eliminada`);
    }

    await this.comisionRepository.restore(id);
    return this.findOne(id);
  }
}
