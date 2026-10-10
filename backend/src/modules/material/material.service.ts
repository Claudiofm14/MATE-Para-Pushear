import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../../entities/material.entity';
import { MaterialContenedor } from '../../entities/material-contenedor.entity';
import { Materia } from '../../entities/materia.entity';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(MaterialContenedor)
    private materialContenedorRepository: Repository<MaterialContenedor>,
    @InjectRepository(Materia)
    private materiaRepository: Repository<Materia>,
  ) {}

  async findAll(): Promise<Material[]> {
    return await this.materialRepository.find({
      relations: {
        materia: true,
        contenedores: {
          contenedor: {
            hijos: true,
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: {
        materia: true,
        contenedores: {
          contenedor: {
            hijos: true,
          },
        },
      },
      withDeleted: true,
    });
    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }
    return material;
  }

  async create(createMaterialDto: CreateMaterialDto): Promise<Material> {
    // Validar que la materia existe
    const materia = await this.materiaRepository.findOne({
      where: { id: createMaterialDto.materiaId },
    });

    if (!materia) {
      throw new NotFoundException(
        `Materia con ID ${createMaterialDto.materiaId} no encontrada`,
      );
    }

    const material = this.materialRepository.create({
      titulo: createMaterialDto.titulo,
      materia: materia,
    });

    const savedMaterial = await this.materialRepository.save(material);

    // Crear las relaciones intermedias con los contenedores
    if (
      createMaterialDto.contenedores &&
      createMaterialDto.contenedores.length > 0
    ) {
      await this.createContenedoresForMaterial(
        savedMaterial,
        createMaterialDto.contenedores,
      );
    }

    return this.findOne(savedMaterial.id);
  }

  private async createContenedoresForMaterial(
    material: Material,
    contenedoresDtos: any[],
  ): Promise<void> {
    const materialContenedores = [];

    for (const contenedorDto of contenedoresDtos) {
      // Primero crear y guardar el contenedor
      const contenedor = this.materialContenedorRepository.manager.create(
        'Contenedor',
        {
          titulo: contenedorDto.titulo,
          subtitulo: contenedorDto.subtitulo,
          tipo: contenedorDto.tipo,
          hijos: contenedorDto.hijos || [],
        },
      );

      const savedContenedor =
        await this.materialContenedorRepository.manager.save(
          'Contenedor',
          contenedor,
        );

      // Luego crear la relación intermedia
      const materialContenedor = this.materialContenedorRepository.create({
        material: material,
        contenedor: savedContenedor,
      });

      materialContenedores.push(materialContenedor);
    }

    await this.materialContenedorRepository.save(materialContenedores);
  }

  async update(
    id: number,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<Material> {
    const material = await this.findOne(id);

    if (updateMaterialDto.titulo) {
      material.titulo = updateMaterialDto.titulo;
    }

    // Si se actualizan los contenedores, eliminamos los antiguos y creamos los nuevos
    if (updateMaterialDto.contenedores) {
      // Eliminar las relaciones existentes
      await this.materialContenedorRepository.delete({ material: { id } });

      // Crear las nuevas relaciones
      await this.createContenedoresForMaterial(
        material,
        updateMaterialDto.contenedores,
      );
    }

    await this.materialRepository.save(material);
    return this.findOne(id);
  }

  async addContenedor(
    materialId: number,
    contenedorDto: any,
  ): Promise<Material> {
    const material = await this.findOne(materialId);
    await this.createContenedoresForMaterial(material, [contenedorDto]);
    return this.findOne(materialId);
  }

  async removeContenedor(
    materialId: number,
    contenedorId: number,
  ): Promise<Material> {
    const material = await this.findOne(materialId);

    // Buscar la relación intermedia
    const materialContenedor = await this.materialContenedorRepository.findOne({
      where: {
        material: { id: materialId },
        contenedor: { id: contenedorId },
      },
    });

    if (!materialContenedor) {
      throw new NotFoundException(
        `Contenedor con ID ${contenedorId} no encontrado en Material ${materialId}`,
      );
    }

    // Eliminar la relación intermedia
    await this.materialContenedorRepository.remove(materialContenedor);

    return this.findOne(materialId);
  }

  async remove(id: number): Promise<void> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['contenedores'],
    });

    if (!material) {
      throw new NotFoundException(`Material ${id} no encontrado`);
    }

    await this.materialRepository.softRemove(material);
  }

  async restore(id: number): Promise<Material> {
    const result = await this.materialRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Material ${id} no encontrado o no estaba borrado`,
      );
    }

    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException(
        `Material ${id} no encontrado después de restaurar`,
      );
    }

    return material;
  }
}
