import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contenedor } from '../../entities/contenedor.entity';
import { CreateContenedorDto, UpdateContenedorDto } from './dto/contenedor.dto';

@Injectable()
export class ContenedorService {
  constructor(
    @InjectRepository(Contenedor)
    private contenedorRepository: Repository<Contenedor>,
  ) {}

  async findOne(id: number): Promise<Contenedor> {
    const contenedor = await this.contenedorRepository.findOne({
      where: { id },
      relations: ['hijos'],
      withDeleted: true,
    });
    if (!contenedor) {
      throw new NotFoundException(`Contenedor con ID ${id} no encontrado`);
    }
    return contenedor;
  }

  async findAll(): Promise<Contenedor[]> {
    return await this.contenedorRepository.find({
      relations: ['hijos'],
    });
  }

  async create(createContenedorDto: CreateContenedorDto): Promise<Contenedor> {
    const contenedor = this.contenedorRepository.create(createContenedorDto);
    return await this.contenedorRepository.save(contenedor);
  }

  async update(
    id: number,
    updateContenedorDto: UpdateContenedorDto,
  ): Promise<Contenedor> {
    const contenedor = await this.contenedorRepository.preload({
      id,
      ...updateContenedorDto,
    });

    if (!contenedor) {
      throw new NotFoundException(`Contenedor ${id} no encontrado`);
    }

    return await this.contenedorRepository.save(contenedor);
  }

  async remove(id: number): Promise<void> {
    const contenedor = await this.contenedorRepository.findOne({
      where: { id },
      relations: ['hijos'],
    });

    if (!contenedor) {
      throw new NotFoundException(`Contenedor ${id} no encontrado`);
    }

    await this.contenedorRepository.softRemove(contenedor);
  }

  async restore(id: number): Promise<Contenedor> {
    const result = await this.contenedorRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Contenedor ${id} no encontrado o no estaba borrado`,
      );
    }

    const contenedor = await this.contenedorRepository.findOne({
      where: { id },
    });
    if (!contenedor) {
      throw new NotFoundException(
        `Contenedor ${id} no encontrado después de restaurar`,
      );
    }

    return contenedor;
  }
}
