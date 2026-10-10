import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_MATERIA_CONFIG, Materia } from '../../entities/materia.entity';
import { CreateMateriaDto, UpdateMateriaDto } from './dto/materia.dto';
import { UpdateMateriaConfigDto } from './dto/materia-config.dto';

export type MateriaVisibilityOptions = {
  /** Solo un admin puede pedir que se incluyan las materias archivadas. */
  incluirArchivadas?: boolean;
};

@Injectable()
export class MateriaService {
  private readonly materiaPublicSelect = {
    id: true,
    nombre: true,
    codigo: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    archivada: true,
    archivadaEn: true,
    archivadaPor: true,
  };

  constructor(
    @InjectRepository(Materia)
    private materiaRepository: Repository<Materia>,
  ) {}

  async findPublicAll(
    opts: MateriaVisibilityOptions = {},
  ): Promise<Partial<Materia>[]> {
    return await this.materiaRepository.find({
      where: opts.incluirArchivadas ? {} : { archivada: false },
      select: this.materiaPublicSelect,
    });
  }

  /**
   * Materias archivadas. Solo para el panel de administracion: una materia
   * archivada no debe aparecer en ninguna vista de alumnos ni docentes.
   */
  async findArchivadas(): Promise<Partial<Materia>[]> {
    return await this.materiaRepository.find({
      where: { archivada: true },
      select: this.materiaPublicSelect,
      order: { archivadaEn: 'DESC' },
    });
  }

  async findPublicOne(
    id: number,
    opts: MateriaVisibilityOptions = {},
  ): Promise<Partial<Materia>> {
    const materia = await this.materiaRepository.findOne({
      where: opts.incluirArchivadas ? { id } : { id, archivada: false },
      select: this.materiaPublicSelect,
    });

    if (!materia) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    return materia;
  }

  async findPublicByCodigo(
    codigo: string,
    opts: MateriaVisibilityOptions = {},
  ): Promise<Partial<Materia>> {
    const materia = await this.materiaRepository.findOne({
      where: opts.incluirArchivadas ? { codigo } : { codigo, archivada: false },
      select: this.materiaPublicSelect,
    });

    if (!materia) {
      throw new NotFoundException(`Materia con código ${codigo} no encontrada`);
    }

    return materia;
  }

  async findAll(): Promise<Materia[]> {
    return await this.materiaRepository.find();
  }

  async findOne(id: number): Promise<Materia> {
    const materia = await this.materiaRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!materia) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    return this.withDefaultConfig(materia);
  }

  private withDefaultConfig(materia: Materia): Materia {
    materia.configuracion = this.mergeConfig(materia.configuracion || {});
    return materia;
  }

  private mergeConfig(config: Record<string, any>): Record<string, any> {
    return {
      ...DEFAULT_MATERIA_CONFIG,
      ...config,
      tabs: {
        ...DEFAULT_MATERIA_CONFIG.tabs,
        ...(config.tabs || {}),
      },
      pages: {
        ...DEFAULT_MATERIA_CONFIG.pages,
        ...(config.pages || {}),
      },
    };
  }

  async findByCodigo(codigo: string): Promise<Materia> {
    const materia = await this.materiaRepository.findOne({
      where: { codigo },
    });

    if (!materia) {
      throw new NotFoundException(`Materia con código ${codigo} no encontrada`);
    }

    return materia;
  }

  async create(createMateriaDto: CreateMateriaDto): Promise<Materia> {
    // Verificar que el código no exista si se proporciona
    if (createMateriaDto.codigo) {
      const existente = await this.materiaRepository.findOne({
        where: { codigo: createMateriaDto.codigo },
      });

      if (existente) {
        throw new ConflictException(
          `Ya existe una materia con el código ${createMateriaDto.codigo}`,
        );
      }
    }

    // Crear la materia solo con datos básicos
    const materia = this.materiaRepository.create({
      nombre: createMateriaDto.nombre,
      codigo: createMateriaDto.codigo,
    });

    const savedMateria = await this.materiaRepository.save(materia);
    return this.findOne(savedMateria.id);
  }

  async getConfiguracion(id: number): Promise<Record<string, any>> {
    const materia = await this.findOne(id);
    return materia.configuracion;
  }

  async updateConfiguracion(
    id: number,
    updateConfigDto: UpdateMateriaConfigDto,
  ): Promise<Record<string, any>> {
    const materia = await this.findOne(id);
    materia.configuracion = this.mergeConfig({
      ...materia.configuracion,
      tabs: {
        ...(materia.configuracion?.tabs || {}),
        ...(updateConfigDto.tabs || {}),
      },
      pages: {
        ...(materia.configuracion?.pages || {}),
        ...(updateConfigDto.pages || {}),
      },
    });

    await this.materiaRepository.save(materia);
    return materia.configuracion;
  }

  async update(
    id: number,
    updateMateriaDto: UpdateMateriaDto,
  ): Promise<Materia> {
    const materia = await this.findOne(id);

    // Verificar código único si se está actualizando
    if (updateMateriaDto.codigo && updateMateriaDto.codigo !== materia.codigo) {
      const existente = await this.materiaRepository.findOne({
        where: { codigo: updateMateriaDto.codigo },
      });

      if (existente) {
        throw new ConflictException(
          `Ya existe una materia con el código ${updateMateriaDto.codigo}`,
        );
      }
    }

    // Actualizar campos básicos
    if (updateMateriaDto.nombre) materia.nombre = updateMateriaDto.nombre;
    if (updateMateriaDto.codigo !== undefined)
      materia.codigo = updateMateriaDto.codigo;

    await this.materiaRepository.save(materia);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const materia = await this.materiaRepository.findOne({
      where: { id },
    });

    if (!materia) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    await this.materiaRepository.softRemove(materia);
  }

  /**
   * Archivar no borra nada: el contenido de la materia (cursadas, semanas,
   * videos, ejercicios, entregas, materiales) queda intacto y vuelve a estar
   * disponible tal cual al desarchivarla.
   */
  async archivar(id: number, actorEmail?: string): Promise<Materia> {
    const materia = await this.materiaRepository.findOne({ where: { id } });

    if (!materia) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    if (materia.archivada) {
      throw new ConflictException(
        `La materia con ID ${id} ya se encuentra archivada`,
      );
    }

    materia.archivada = true;
    materia.archivadaEn = new Date();
    materia.archivadaPor = actorEmail ?? null;

    await this.materiaRepository.save(materia);
    return this.findOne(id);
  }

  async desarchivar(id: number): Promise<Materia> {
    const materia = await this.materiaRepository.findOne({ where: { id } });

    if (!materia) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    if (!materia.archivada) {
      throw new ConflictException(
        `La materia con ID ${id} no se encuentra archivada`,
      );
    }

    materia.archivada = false;
    materia.archivadaEn = null;
    materia.archivadaPor = null;

    await this.materiaRepository.save(materia);
    return this.findOne(id);
  }

  async restore(id: number): Promise<Materia> {
    const materia = await this.materiaRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!materia) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    await this.materiaRepository.recover(materia);
    return this.findOne(id);
  }
}
