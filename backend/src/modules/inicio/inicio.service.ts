import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inicio } from '../../entities/inicio.entity';
import { InicioContenedor } from '../../entities/inicio-contenedor.entity';
import { Materia } from '../../entities/materia.entity';
import { CreateInicioDto, UpdateInicioDto } from './dto/inicio.dto';

@Injectable()
export class InicioService {
  constructor(
    @InjectRepository(Inicio)
    private inicioRepository: Repository<Inicio>,
    @InjectRepository(InicioContenedor)
    private inicioContenedorRepository: Repository<InicioContenedor>,
    @InjectRepository(Materia)
    private materiaRepository: Repository<Materia>,
  ) {}

  async findAll(): Promise<Inicio[]> {
    return await this.inicioRepository.find({
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

  async findOne(id: number): Promise<Inicio> {
    const inicio = await this.inicioRepository.findOne({
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
    if (!inicio) {
      throw new NotFoundException(`Inicio con ID ${id} no encontrado`);
    }
    return inicio;
  }

  async findByMateria(materiaId: number): Promise<Inicio> {
    const inicio = await this.inicioRepository
      .createQueryBuilder('inicio')
      .leftJoinAndSelect('inicio.materia', 'materia')
      .leftJoinAndSelect('inicio.contenedores', 'inicioContenedor')
      .leftJoinAndSelect('inicioContenedor.contenedor', 'contenedor')
      .leftJoinAndSelect('contenedor.hijos', 'hijos')
      .where('materia.id = :materiaId', { materiaId })
      .getOne();

    if (!inicio) {
      throw new NotFoundException(
        `No se encontró un inicio para la materia con ID ${materiaId}`,
      );
    }

    return inicio;
  }
  async create(createInicioDto: CreateInicioDto): Promise<Inicio> {
    const materia = await this.materiaRepository.findOne({
      where: { id: createInicioDto.materiaId },
    });

    if (!materia) {
      throw new NotFoundException(
        `Materia con ID ${createInicioDto.materiaId} no encontrada`,
      );
    }

    const inicio = this.inicioRepository.create({
      titulo: createInicioDto.titulo,
      contenido: createInicioDto.contenido,
      materia: materia,
    });

    const savedInicio = await this.inicioRepository.save(inicio);

    if (
      createInicioDto.contenedores &&
      createInicioDto.contenedores.length > 0
    ) {
      await this.createContenedoresForInicio(
        savedInicio,
        createInicioDto.contenedores,
      );
    }

    return this.findOne(savedInicio.id);
  }

  private async createContenedoresForInicio(
    inicio: Inicio,
    contenedoresDtos: any[],
  ): Promise<void> {
    const inicioContenedores = [];

    for (const contenedorDto of contenedoresDtos) {
      let hijosCreados = [];
      if (contenedorDto.hijos && contenedorDto.hijos.length > 0) {
        for (const hijoDto of contenedorDto.hijos) {
          const hijo = this.inicioContenedorRepository.manager.create(
            'Contenedor',
            {
              titulo: hijoDto.titulo,
              subtitulo: hijoDto.subtitulo,
              tipo: 'subNivel',
            },
          );
          const savedHijo = await this.inicioContenedorRepository.manager.save(
            'Contenedor',
            hijo,
          );
          hijosCreados.push(savedHijo);
        }
      }

      const contenedor = this.inicioContenedorRepository.manager.create(
        'Contenedor',
        {
          titulo: contenedorDto.titulo,
          subtitulo: contenedorDto.subtitulo,
          tipo: contenedorDto.tipo,
          hijos: hijosCreados,
        },
      );

      const savedContenedor =
        await this.inicioContenedorRepository.manager.save(
          'Contenedor',
          contenedor,
        );

      const inicioContenedor = this.inicioContenedorRepository.create({
        inicio: inicio,
        contenedor: savedContenedor,
      });

      inicioContenedores.push(inicioContenedor);
    }

    await this.inicioContenedorRepository.save(inicioContenedores);
  }

  async update(id: number, updateInicioDto: UpdateInicioDto): Promise<Inicio> {
    const queryRunner =
      this.inicioRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inicio = await queryRunner.manager.findOne(Inicio, {
        where: { id },
        relations: {
          materia: true,
          contenedores: {
            contenedor: {
              hijos: true,
            },
          },
        },
      });

      if (!inicio) {
        throw new NotFoundException(`Inicio con ID ${id} no encontrado`);
      }

      if (updateInicioDto.titulo) {
        inicio.titulo = updateInicioDto.titulo;
      }

      if (updateInicioDto.contenido !== undefined) {
        inicio.contenido = updateInicioDto.contenido;
      }

      await queryRunner.manager.save(Inicio, inicio);

      if (updateInicioDto.contenedores !== undefined) {
        const relacionesExistentes = await queryRunner.manager.find(
          InicioContenedor,
          {
            where: { inicio: { id } },
            relations: { contenedor: { hijos: true } },
          },
        );

        const contenedorIds = relacionesExistentes.map(
          (rel) => rel.contenedor.id,
        );

        if (relacionesExistentes.length > 0) {
          await queryRunner.manager.remove(
            InicioContenedor,
            relacionesExistentes,
          );
        }

        if (contenedorIds.length > 0) {
          await queryRunner.manager.delete('Contenedor', contenedorIds);
        }

        if (updateInicioDto.contenedores.length > 0) {
          await this.createContenedoresForInicioWithTransaction(
            queryRunner,
            inicio,
            updateInicioDto.contenedores,
          );
        }
      }

      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createContenedoresForInicioWithTransaction(
    queryRunner: any,
    inicio: Inicio,
    contenedoresDtos: any[],
  ): Promise<void> {
    const inicioContenedores = [];

    for (const contenedorDto of contenedoresDtos) {
      const contenedor = queryRunner.manager.create('Contenedor', {
        titulo: contenedorDto.titulo,
        subtitulo: contenedorDto.subtitulo,
        tipo: contenedorDto.tipo,
      });

      const savedContenedor = await queryRunner.manager.save(
        'Contenedor',
        contenedor,
      );

      if (contenedorDto.hijos && contenedorDto.hijos.length > 0) {
        for (const hijoDto of contenedorDto.hijos) {
          const hijo = queryRunner.manager.create('Contenedor', {
            titulo: hijoDto.titulo,
            subtitulo: hijoDto.subtitulo,
            tipo: 'subNivel',
            padre: savedContenedor,
          });
          await queryRunner.manager.save('Contenedor', hijo);
        }
      }

      const inicioContenedor = queryRunner.manager.create(InicioContenedor, {
        inicio: inicio,
        contenedor: savedContenedor,
      });

      inicioContenedores.push(inicioContenedor);
    }

    await queryRunner.manager.save(InicioContenedor, inicioContenedores);
  }
  async addContenedor(inicioId: number, contenedorDto: any): Promise<Inicio> {
    const inicio = await this.findOne(inicioId);
    await this.createContenedoresForInicio(inicio, [contenedorDto]);
    return this.findOne(inicioId);
  }

  async removeContenedor(
    inicioId: number,
    contenedorId: number,
  ): Promise<Inicio> {
    const inicio = await this.findOne(inicioId);

    const inicioContenedor = await this.inicioContenedorRepository.findOne({
      where: {
        inicio: { id: inicioId },
        contenedor: { id: contenedorId },
      },
    });

    if (!inicioContenedor) {
      throw new NotFoundException(
        `Contenedor con ID ${contenedorId} no encontrado en Inicio ${inicioId}`,
      );
    }

    await this.inicioContenedorRepository.remove(inicioContenedor);

    return this.findOne(inicioId);
  }

  async remove(id: number): Promise<void> {
    const inicio = await this.inicioRepository.findOne({
      where: { id },
      relations: ['contenedores'],
    });

    if (!inicio) {
      throw new NotFoundException(`Inicio ${id} no encontrado`);
    }

    await this.inicioRepository.softRemove(inicio);
  }

  async restore(id: number): Promise<Inicio> {
    const result = await this.inicioRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Inicio ${id} no encontrado o no estaba borrado`,
      );
    }

    const inicio = await this.inicioRepository.findOne({ where: { id } });
    if (!inicio) {
      throw new NotFoundException(
        `Inicio ${id} no encontrado después de restaurar`,
      );
    }

    return inicio;
  }
}
