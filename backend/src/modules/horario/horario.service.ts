import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Horario } from '../../entities/horario.entity';
import { Semana } from '../../entities/semana.entity';
import { CreateHorarioDto, UpdateHorarioDto } from './dto/horario.dto';

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(Horario)
    private horarioRepository: Repository<Horario>,
    @InjectRepository(Semana)
    private semanaRepository: Repository<Semana>,
  ) {}

  async findAll(): Promise<Horario[]> {
    return await this.horarioRepository.find({
      relations: ['semana'],
      order: { orden: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Horario> {
    const horario = await this.horarioRepository.findOne({
      where: { id },
      relations: ['semana', 'semana.cursada', 'semana.cursada.materia'],
      withDeleted: true,
    });

    if (!horario) {
      throw new NotFoundException(`Horario con ID ${id} no encontrado`);
    }

    return horario;
  }

  async findBySemana(semanaId: number): Promise<Horario[]> {
    return await this.horarioRepository.find({
      where: { semana: { id: semanaId } },
      relations: ['semana'],
      order: { orden: 'ASC', id: 'ASC' },
    });
  }

  async create(createHorarioDto: CreateHorarioDto): Promise<Horario> {
    const semana = await this.semanaRepository.findOne({
      where: { id: createHorarioDto.semanaId },
    });

    if (!semana) {
      throw new NotFoundException(
        `Semana con ID ${createHorarioDto.semanaId} no encontrada`,
      );
    }

    const { maxOrden } = await this.horarioRepository
      .createQueryBuilder('horario')
      .select('COALESCE(MAX(horario.orden), 0)', 'maxOrden')
      .where('horario.semanaId = :semanaId', { semanaId: semana.id })
      .getRawOne<{ maxOrden: string }>();

    const horario = this.horarioRepository.create({
      titulo: createHorarioDto.titulo,
      tipo: createHorarioDto.tipo,
      detalle: createHorarioDto.detalle,
      url: createHorarioDto.url ?? null,
      orden: Number(maxOrden) + 1,
      semana,
    });

    return await this.horarioRepository.save(horario);
  }

  async reorder(semanaId: number, horarioIds: number[]): Promise<Horario[]> {
    const horarios = await this.horarioRepository.find({
      where: { semana: { id: semanaId } },
    });

    const actuales = new Set(horarios.map((horario) => horario.id));
    if (
      horarios.length !== horarioIds.length ||
      horarioIds.some((id) => !actuales.has(id))
    ) {
      throw new ConflictException(
        'La lista debe incluir exactamente todos los horarios activos de la semana',
      );
    }

    await this.horarioRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Horario);
      await Promise.all(
        horarioIds.map((id, index) =>
          repository.update(
            { id, semana: { id: semanaId } },
            { orden: index + 1 },
          ),
        ),
      );
    });

    return this.horarioRepository.find({
      where: { id: In(horarioIds), semana: { id: semanaId } },
      order: { orden: 'ASC', id: 'ASC' },
    });
  }

  async update(
    id: number,
    updateHorarioDto: UpdateHorarioDto,
  ): Promise<Horario> {
    const horario = await this.findOne(id);

    if (updateHorarioDto.semanaId) {
      const semana = await this.semanaRepository.findOne({
        where: { id: updateHorarioDto.semanaId },
      });

      if (!semana) {
        throw new NotFoundException(
          `Semana con ID ${updateHorarioDto.semanaId} no encontrada`,
        );
      }

      horario.semana = semana;
    }

    if (updateHorarioDto.titulo) {
      horario.titulo = updateHorarioDto.titulo;
    }

    if (updateHorarioDto.tipo) {
      horario.tipo = updateHorarioDto.tipo;
    }

    if (updateHorarioDto.detalle) {
      horario.detalle = updateHorarioDto.detalle;
    }

    // Un string vacio o null significa "quitar el enlace", no "no lo toques".
    if (updateHorarioDto.url !== undefined) {
      horario.url = updateHorarioDto.url?.trim() ? updateHorarioDto.url : null;
    }

    return await this.horarioRepository.save(horario);
  }

  async remove(id: number): Promise<void> {
    const horario = await this.findOne(id);
    await this.horarioRepository.softRemove(horario);
  }

  async restore(id: number): Promise<Horario> {
    const horario = await this.findOne(id);

    if (!horario.deletedAt) {
      throw new ConflictException(`Horario con ID ${id} no está eliminado`);
    }

    await this.horarioRepository.restore(id);
    return this.findOne(id);
  }
}
