import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MaterialAcademico } from '../../entities/material-academico.entity';
import {
  CreateMaterialAcademicoDto,
  UpdateMaterialAcademicoDto,
} from './dto/material-academico.dto';
import { sanitizeRichContent } from '../../utils/html-sanitizer';

@Injectable()
export class MaterialAcademicoService {
  constructor(
    @InjectRepository(MaterialAcademico)
    private readonly materialRepository: Repository<MaterialAcademico>,
  ) {}

  async create(
    createDto: CreateMaterialAcademicoDto,
  ): Promise<MaterialAcademico> {
    const material = this.materialRepository.create(
      this.sanitizeDto(createDto),
    );
    return await this.materialRepository.save(material);
  }

  async findAll(): Promise<MaterialAcademico[]> {
    return await this.materialRepository.find({
      where: { visible: true },
      order: { orden: 'ASC', categoria: 'ASC', createdAt: 'ASC' },
      relations: ['materia'],
    });
  }

  async findByMateria(materiaId: number): Promise<MaterialAcademico[]> {
    return await this.materialRepository.find({
      where: { materiaId, visible: true },
      order: { orden: 'ASC', categoria: 'ASC', createdAt: 'ASC' },
    });
  }

  async findByCategoria(categoria: string): Promise<MaterialAcademico[]> {
    return await this.materialRepository.find({
      where: { categoria, visible: true },
      order: { orden: 'ASC', createdAt: 'ASC' },
      relations: ['materia'],
    });
  }

  async findOne(id: number): Promise<MaterialAcademico> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['materia'],
    });

    if (!material) {
      throw new NotFoundException(
        `Material académico con ID ${id} no encontrado`,
      );
    }

    return material;
  }

  async update(
    id: number,
    updateDto: UpdateMaterialAcademicoDto,
  ): Promise<MaterialAcademico> {
    const material = await this.findOne(id);
    Object.assign(material, this.sanitizeDto(updateDto));
    return await this.materialRepository.save(material);
  }

  async findByMaterias(materiaIds: number[]): Promise<MaterialAcademico[]> {
    if (materiaIds.length === 0) return [];

    return await this.materialRepository.find({
      where: { materiaId: In(materiaIds), visible: true },
      order: { orden: 'ASC', categoria: 'ASC', createdAt: 'ASC' },
      relations: ['materia'],
    });
  }

  private sanitizeDto<
    T extends CreateMaterialAcademicoDto | UpdateMaterialAcademicoDto,
  >(dto: T): T {
    return {
      ...dto,
      descripcion: sanitizeRichContent(dto.descripcion),
      contenido: sanitizeRichContent(dto.contenido),
    };
  }

  async remove(id: number): Promise<void> {
    const material = await this.findOne(id);
    await this.materialRepository.remove(material);
  }

  async reorder(items: { id: number; orden: number }[]): Promise<void> {
    const promises = items.map(async (item) => {
      await this.materialRepository.update(item.id, { orden: item.orden });
    });
    await Promise.all(promises);
  }
}
