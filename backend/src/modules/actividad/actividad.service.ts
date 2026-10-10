import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { In } from 'typeorm';
import { Actividad } from '../../entities/actividad.entity';
import { Comision } from '../../entities/comision.entity';
import { CreateActividadDto, UpdateActividadDto } from './dto';

@Injectable()
export class ActividadService {
  constructor(
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(Comision)
    private readonly comisionRepository: Repository<Comision>,
  ) {}

  /**
   * Crear nueva actividad
   */
  async crear(dto: CreateActividadDto): Promise<Actividad> {
    const { comisionIds, ...actividadData } = dto;
    const actividad = this.actividadRepository.create(actividadData);
    actividad.comisiones = await this.obtenerComisionesAsignadas(
      actividad.materiaId,
      comisionIds,
    );
    return await this.actividadRepository.save(actividad);
  }

  /**
   * Listar actividades de una materia
   */
  async listarPorMateria(materiaId: number): Promise<Actividad[]> {
    return await this.actividadRepository.find({
      where: { materiaId, activo: true },
      relations: ['comisiones'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Obtener una actividad por ID
   */
  async obtenerPorId(id: number): Promise<Actividad> {
    const actividad = await this.actividadRepository.findOne({
      where: { id },
      relations: ['materia', 'comisiones'],
    });

    if (!actividad) {
      throw new NotFoundException('Actividad no encontrada');
    }

    return actividad;
  }

  async obtenerPorIds(ids: number[]): Promise<Actividad[]> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) return [];

    return await this.actividadRepository.find({
      where: { id: In(uniqueIds) },
      relations: ['materia'],
    });
  }

  /**
   * Actualizar actividad
   */
  async actualizar(id: number, dto: UpdateActividadDto): Promise<Actividad> {
    const actividad = await this.obtenerPorId(id);
    const { comisionIds, ...actividadData } = dto;

    Object.assign(actividad, actividadData);

    // Vacio y null significan "quitar la descripcion", no "dejarla como estaba".
    if (actividadData.descripcion !== undefined) {
      actividad.descripcion = actividadData.descripcion?.trim()
        ? actividadData.descripcion
        : null;
    }

    if (comisionIds !== undefined) {
      actividad.comisiones = await this.obtenerComisionesAsignadas(
        actividad.materiaId,
        comisionIds,
      );
    }

    return await this.actividadRepository.save(actividad);
  }

  /**
   * Eliminar (desactivar) actividad
   */
  async eliminar(id: number): Promise<void> {
    const actividad = await this.obtenerPorId(id);
    actividad.activo = false;
    await this.actividadRepository.save(actividad);
  }

  private async obtenerComisionesAsignadas(
    materiaId: number,
    comisionIds?: number[],
  ): Promise<Comision[]> {
    if (!comisionIds || comisionIds.length === 0) {
      return [];
    }

    const comisiones = await this.comisionRepository.find({
      where: {
        id: In(comisionIds),
        cursada: { materia: { id: materiaId } },
      },
      relations: ['cursada', 'cursada.materia'],
    });

    if (comisiones.length !== comisionIds.length) {
      throw new NotFoundException(
        'Una o mas comisiones no fueron encontradas o no pertenecen a la materia',
      );
    }

    return comisiones;
  }
}
