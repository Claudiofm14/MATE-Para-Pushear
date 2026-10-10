import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContratoPedagogico } from '../../entities/contrato_pedagogico.entity';
import { ContratoPedagogicoContenedor } from '../../entities/contrato-pedagogico-contenedor.entity';
import { Materia } from '../../entities/materia.entity';
import {
  ContratoPedagogicoDto,
  UpdateContratoDto,
} from './dto/contrato-pedagogico.dto';
import { Contenedor } from '../../entities/contenedor.entity';

@Injectable()
export class ContratoPedagogicoService {
  constructor(
    @InjectRepository(ContratoPedagogico)
    private contratoRepository: Repository<ContratoPedagogico>,
    @InjectRepository(ContratoPedagogicoContenedor)
    private contratoContenedorRepository: Repository<ContratoPedagogicoContenedor>,
    @InjectRepository(Materia)
    private materiaRepository: Repository<Materia>,
  ) {}

  async findAll(): Promise<ContratoPedagogico[]> {
    return await this.contratoRepository.find({
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

  async findOne(id: number): Promise<ContratoPedagogico> {
    const contrato = await this.contratoRepository.findOne({
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

    if (!contrato) {
      throw new NotFoundException(`Contrato con ID ${id} no encontrado`);
    }

    return contrato;
  }

  async create(
    createContratoDto: ContratoPedagogicoDto,
  ): Promise<ContratoPedagogico> {
    // Validar que la materia existe
    const materia = await this.materiaRepository.findOne({
      where: { id: createContratoDto.materiaId },
    });

    if (!materia) {
      throw new NotFoundException(
        `Materia con ID ${createContratoDto.materiaId} no encontrada`,
      );
    }

    const contrato = this.contratoRepository.create({
      titulo: createContratoDto.titulo,
      materia: materia,
    });

    const savedContrato = await this.contratoRepository.save(contrato);

    // Crear las relaciones intermedias con los contenedores
    if (createContratoDto.secciones && createContratoDto.secciones.length > 0) {
      await this.createContenedoresForContrato(
        savedContrato,
        createContratoDto.secciones,
      );
    }

    return this.findOne(savedContrato.id);
  }

  async update(
    id: number,
    updateContratoDto: UpdateContratoDto,
  ): Promise<ContratoPedagogico> {
    const contrato = await this.findOne(id);

    if (updateContratoDto.titulo) {
      await this.contratoRepository.update(id, {
        titulo: updateContratoDto.titulo,
      });
    }

    // Si se actualizan las secciones, eliminamos las antiguas y creamos las nuevas
    if (updateContratoDto.secciones) {
      // Eliminar las relaciones existentes
      await this.contratoContenedorRepository.delete({
        contratoPedagogico: { id },
      });

      // Crear las nuevas relaciones
      await this.createContenedoresForContrato(
        contrato,
        updateContratoDto.secciones,
      );
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const contrato = await this.contratoRepository.findOne({
      where: { id },
      relations: { contenedores: true },
    });

    if (!contrato) {
      throw new NotFoundException(`Contrato con ID ${id} no encontrado`);
    }

    await this.contratoRepository.softRemove(contrato);
  }

  async restore(id: number): Promise<ContratoPedagogico> {
    const contrato = await this.contratoRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!contrato) {
      throw new NotFoundException(`Contrato con ID ${id} no encontrado`);
    }

    await this.contratoRepository.recover(contrato);
    return contrato;
  }

  async addContenedor(
    contratoId: number,
    createContenedorDto: any,
  ): Promise<ContratoPedagogico> {
    const contrato = await this.findOne(contratoId);
    await this.createContenedoresForContrato(contrato, [createContenedorDto]);
    return this.findOne(contratoId);
  }

  async removeContenedor(
    contratoId: number,
    contenedorId: number,
  ): Promise<ContratoPedagogico> {
    const contrato = await this.findOne(contratoId);

    const contratoContenedor = await this.contratoContenedorRepository.findOne({
      where: {
        contratoPedagogico: { id: contratoId },
        contenedor: { id: contenedorId },
      },
    });

    if (!contratoContenedor) {
      throw new NotFoundException(
        `Contenedor con ID ${contenedorId} no encontrado en el contrato con ID ${contratoId}`,
      );
    }

    await this.contratoContenedorRepository.remove(contratoContenedor);
    return this.findOne(contratoId);
  }

  private async createContenedoresForContrato(
    contrato: ContratoPedagogico,
    seccionesDtos: any[],
  ): Promise<void> {
    const contratoContenedores = [];

    for (const seccionDto of seccionesDtos) {
      // Validar que al menos titulo o subtitulo estén presentes
      if (!seccionDto.titulo && !seccionDto.subtitulo) {
        throw new BadRequestException(
          'Cada sección debe tener al menos un título o subtítulo',
        );
      }

      // Crear y guardar los hijos si existen
      const hijos = [];
      if (seccionDto.hijos && seccionDto.hijos.length > 0) {
        for (const hijo of seccionDto.hijos) {
          if (!hijo.titulo && !hijo.subtitulo) {
            throw new BadRequestException(
              'Cada subnivel debe tener al menos un título o subtítulo',
            );
          }
          const hijoContenedor =
            this.contratoContenedorRepository.manager.create(Contenedor, {
              titulo: hijo.titulo ?? '',
              subtitulo: hijo.subtitulo ?? '',
              tipo: hijo.tipo ?? 'subNivel',
              hijos: [],
            });
          const savedHijo =
            await this.contratoContenedorRepository.manager.save(
              Contenedor,
              hijoContenedor,
            );
          hijos.push(savedHijo);
        }
      }

      // Crear y guardar el contenedor principal
      const contenedor = this.contratoContenedorRepository.manager.create(
        Contenedor,
        {
          titulo: seccionDto.titulo ?? '',
          subtitulo: seccionDto.subtitulo ?? '',
          tipo: seccionDto.tipo ?? 'bienvenida',
          hijos: hijos,
        },
      );

      const savedContenedor =
        await this.contratoContenedorRepository.manager.save(
          Contenedor,
          contenedor,
        );

      // Crear la relación intermedia
      const contratoContenedor = this.contratoContenedorRepository.create({
        contratoPedagogico: contrato,
        contenedor: savedContenedor,
      });

      contratoContenedores.push(contratoContenedor);
    }

    await this.contratoContenedorRepository.save(contratoContenedores);
  }
}
