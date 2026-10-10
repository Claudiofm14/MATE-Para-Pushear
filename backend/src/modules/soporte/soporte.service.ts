import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import {
  AdjuntoSoporte,
  MensajeSoporte,
  ReporteSoporte,
  Usuario,
} from '../../entities/index.entity';
import {
  ReporteSoporteCategoria,
  ReporteSoporteEstado,
} from '../../entities/reporte-soporte.entity';
import { CrearReporteDto, ListarReportesDto } from './dto/soporte.dto';

export type ImagenSubida = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type AdjuntoVista = {
  id: number;
  nombre: string;
  mimeType: string;
  tamanio: number;
  url: string;
};

export type MensajeVista = {
  id: number;
  cuerpo: string;
  esAdmin: boolean;
  autorNombre: string;
  createdAt: Date;
  adjuntos: AdjuntoVista[];
};

export type ReporteVista = {
  id: number;
  categoria: ReporteSoporteCategoria;
  asunto: string;
  estado: ReporteSoporteEstado;
  createdAt: Date;
  ultimoMensajeEn: Date;
  cerradoEn: Date | null;
  paginaOrigen: string | null;
  userAgent: string | null;
  usuario: { id: number; nombre: string; email: string };
  mensajes: MensajeVista[];
  noLeidos: number;
};

export type ReporteResumen = Omit<ReporteVista, 'mensajes'> & {
  ultimoMensaje: string;
  cantidadMensajes: number;
  esperandoRespuesta: boolean;
};

const TAMANIO_MAXIMO_ADJUNTO = 5 * 1024 * 1024;

/**
 * El tipo declarado por el cliente no es confiable: se deduce del contenido
 * real del archivo y ese es el que se guarda y se sirve despues.
 */
function detectarTipoDeImagen(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  const empiezaCon = (bytes: number[]) =>
    bytes.every((byte, index) => buffer[index] === byte);

  if (empiezaCon([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  if (empiezaCon([0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  const gif = buffer.toString('ascii', 0, 6);
  if (gif === 'GIF87a' || gif === 'GIF89a') {
    return 'image/gif';
  }

  return null;
}

@Injectable()
export class SoporteService {
  constructor(
    @InjectRepository(ReporteSoporte)
    private readonly reporteRepository: Repository<ReporteSoporte>,
    @InjectRepository(MensajeSoporte)
    private readonly mensajeRepository: Repository<MensajeSoporte>,
    @InjectRepository(AdjuntoSoporte)
    private readonly adjuntoRepository: Repository<AdjuntoSoporte>,
    private readonly dataSource: DataSource,
  ) {}

  // --- Lecturas ---------------------------------------------------------

  /**
   * Hilo que el usuario ve en el widget: el que tiene abierto, o uno recien
   * cerrado que todavia no vio, para que no se pierda la respuesta final.
   */
  async obtenerHiloDeUsuario(usuarioId: number): Promise<ReporteVista | null> {
    const reporte = await this.reporteRepository
      .createQueryBuilder('reporte')
      .leftJoinAndSelect('reporte.usuario', 'usuario')
      .where('reporte.usuarioId = :usuarioId', { usuarioId })
      .andWhere(
        `(reporte.estado = :abierto
          OR (reporte.estado = :cerrado
              AND (reporte.ultimaLecturaUsuario IS NULL
                   OR reporte.ultimaLecturaUsuario < reporte.cerradoEn)))`,
        {
          abierto: ReporteSoporteEstado.ABIERTO,
          cerrado: ReporteSoporteEstado.CERRADO,
        },
      )
      .orderBy('reporte.id', 'DESC')
      .getOne();

    if (!reporte) return null;

    return this.componerVista(reporte, false);
  }

  async obtenerResumenDeUsuario(usuarioId: number) {
    const hilo = await this.obtenerHiloDeUsuario(usuarioId);

    return {
      tieneHilo: !!hilo,
      estado: hilo?.estado ?? null,
      noLeidos: hilo?.noLeidos ?? 0,
    };
  }

  async listarParaAdmin(filtros: ListarReportesDto): Promise<ReporteResumen[]> {
    const query = this.reporteRepository
      .createQueryBuilder('reporte')
      .leftJoinAndSelect('reporte.usuario', 'usuario')
      .orderBy('reporte.ultimoMensajeEn', 'DESC');

    if (filtros.estado) {
      query.andWhere('reporte.estado = :estado', { estado: filtros.estado });
    }
    if (filtros.categoria) {
      query.andWhere('reporte.categoria = :categoria', {
        categoria: filtros.categoria,
      });
    }

    const reportes = await query.getMany();
    if (reportes.length === 0) return [];

    const mensajes = await this.mensajeRepository
      .createQueryBuilder('mensaje')
      .where('mensaje.reporteId IN (:...ids)', {
        ids: reportes.map((reporte) => reporte.id),
      })
      .orderBy('mensaje.id', 'ASC')
      .getMany();

    return reportes.map((reporte) => {
      const propios = mensajes.filter(
        (mensaje) => mensaje.reporteId === reporte.id,
      );
      const ultimo = propios[propios.length - 1];

      return {
        ...this.datosBase(reporte),
        noLeidos: this.contarNoLeidos(reporte, propios, true),
        ultimoMensaje: ultimo?.cuerpo ?? '',
        cantidadMensajes: propios.length,
        esperandoRespuesta: !!ultimo && !ultimo.esAdmin,
      };
    });
  }

  async obtenerParaAdmin(reporteId: number): Promise<ReporteVista> {
    const reporte = await this.buscarReporte(reporteId);
    return this.componerVista(reporte, true);
  }

  // --- Escrituras -------------------------------------------------------

  async crear(
    usuario: Usuario,
    dto: CrearReporteDto,
    imagen: ImagenSubida | undefined,
    userAgent?: string,
  ): Promise<ReporteVista> {
    const existente = await this.obtenerHiloDeUsuario(usuario.id);
    if (existente) {
      throw new ConflictException(
        'Ya tenes un reporte en curso. Continua la conversacion en ese hilo.',
      );
    }

    const adjunto = this.validarImagen(imagen);
    const ahora = new Date();

    const reporteId = await this.dataSource.transaction(async (manager) => {
      const reporte = await manager.save(
        manager.create(ReporteSoporte, {
          usuarioId: usuario.id,
          categoria: dto.categoria,
          asunto: dto.asunto.trim(),
          estado: ReporteSoporteEstado.ABIERTO,
          paginaOrigen: dto.paginaOrigen?.slice(0, 255) ?? null,
          userAgent: userAgent?.slice(0, 400) ?? null,
          ultimoMensajeEn: ahora,
          ultimaLecturaUsuario: ahora,
        }),
      );

      await this.guardarMensaje(manager, {
        reporteId: reporte.id,
        autor: usuario,
        esAdmin: false,
        cuerpo: dto.mensaje.trim(),
        adjunto,
      });

      return reporte.id;
    });

    const creado = await this.buscarReporte(reporteId);
    return this.componerVista(creado, false);
  }

  async responderComoUsuario(
    usuario: Usuario,
    cuerpo: string | undefined,
    imagen: ImagenSubida | undefined,
  ): Promise<ReporteVista> {
    const reporte = await this.reporteRepository.findOne({
      where: {
        usuarioId: usuario.id,
        estado: ReporteSoporteEstado.ABIERTO,
        deletedAt: IsNull(),
      },
    });

    if (!reporte) {
      throw new NotFoundException('No tenes un reporte abierto');
    }

    return this.agregarMensaje(reporte, usuario, false, cuerpo, imagen);
  }

  async responderComoAdmin(
    reporteId: number,
    admin: Usuario,
    cuerpo: string | undefined,
    imagen: ImagenSubida | undefined,
  ): Promise<ReporteVista> {
    const reporte = await this.buscarReporte(reporteId);

    if (reporte.estado === ReporteSoporteEstado.CERRADO) {
      throw new ConflictException(
        'El reporte esta cerrado. Reabrilo para seguir la conversacion.',
      );
    }

    return this.agregarMensaje(reporte, admin, true, cuerpo, imagen);
  }

  async cerrar(reporteId: number, admin: Usuario): Promise<ReporteVista> {
    const reporte = await this.buscarReporte(reporteId);

    if (reporte.estado === ReporteSoporteEstado.CERRADO) {
      throw new ConflictException('El reporte ya estaba cerrado');
    }

    reporte.estado = ReporteSoporteEstado.CERRADO;
    reporte.cerradoEn = new Date();
    reporte.cerradoPorId = admin.id;
    reporte.ultimaLecturaAdmin = new Date();
    await this.reporteRepository.save(reporte);

    return this.componerVista(await this.buscarReporte(reporteId), true);
  }

  async reabrir(reporteId: number): Promise<ReporteVista> {
    const reporte = await this.buscarReporte(reporteId);

    if (reporte.estado === ReporteSoporteEstado.ABIERTO) {
      throw new ConflictException('El reporte ya estaba abierto');
    }

    // El indice unico parcial no admite dos hilos abiertos del mismo usuario.
    const abierto = await this.reporteRepository.findOne({
      where: {
        usuarioId: reporte.usuarioId,
        estado: ReporteSoporteEstado.ABIERTO,
        deletedAt: IsNull(),
      },
    });
    if (abierto) {
      throw new ConflictException(
        'El usuario ya tiene otro reporte abierto. Cerra ese primero.',
      );
    }

    reporte.estado = ReporteSoporteEstado.ABIERTO;
    reporte.cerradoEn = null;
    reporte.cerradoPorId = null;
    await this.reporteRepository.save(reporte);

    return this.componerVista(await this.buscarReporte(reporteId), true);
  }

  /**
   * El usuario confirma que vio el cierre: a partir de aca el hilo desaparece
   * de su widget y puede abrir uno nuevo.
   */
  async marcarLeidoPorUsuario(usuarioId: number): Promise<void> {
    const reporte = await this.reporteRepository
      .createQueryBuilder('reporte')
      .where('reporte.usuarioId = :usuarioId', { usuarioId })
      .orderBy('reporte.id', 'DESC')
      .getOne();

    if (!reporte) return;

    reporte.ultimaLecturaUsuario = new Date();
    await this.reporteRepository.save(reporte);
  }

  async marcarLeidoPorAdmin(reporteId: number): Promise<void> {
    const reporte = await this.buscarReporte(reporteId);
    reporte.ultimaLecturaAdmin = new Date();
    await this.reporteRepository.save(reporte);
  }

  async obtenerAdjunto(
    adjuntoId: number,
    usuario: Usuario,
    esAdmin: boolean,
  ): Promise<AdjuntoSoporte> {
    const adjunto = await this.adjuntoRepository
      .createQueryBuilder('adjunto')
      .addSelect('adjunto.contenido')
      .leftJoinAndSelect('adjunto.mensaje', 'mensaje')
      .leftJoinAndSelect('mensaje.reporte', 'reporte')
      .where('adjunto.id = :adjuntoId', { adjuntoId })
      .getOne();

    if (!adjunto) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    if (!esAdmin && adjunto.mensaje?.reporte?.usuarioId !== usuario.id) {
      throw new ForbiddenException('No tenes acceso a este adjunto');
    }

    return adjunto;
  }

  // --- Internos ---------------------------------------------------------

  private async agregarMensaje(
    reporte: ReporteSoporte,
    autor: Usuario,
    esAdmin: boolean,
    cuerpo: string | undefined,
    imagen: ImagenSubida | undefined,
  ): Promise<ReporteVista> {
    const adjunto = this.validarImagen(imagen);
    const texto = cuerpo?.trim() ?? '';

    if (!texto && !adjunto) {
      throw new BadRequestException(
        'El mensaje no puede estar vacio: escribi algo o adjunta una imagen.',
      );
    }

    const ahora = new Date();

    await this.dataSource.transaction(async (manager) => {
      await this.guardarMensaje(manager, {
        reporteId: reporte.id,
        autor,
        esAdmin,
        cuerpo: texto,
        adjunto,
      });

      await manager.update(ReporteSoporte, reporte.id, {
        ultimoMensajeEn: ahora,
        ...(esAdmin
          ? { ultimaLecturaAdmin: ahora }
          : { ultimaLecturaUsuario: ahora }),
      });
    });

    return this.componerVista(await this.buscarReporte(reporte.id), esAdmin);
  }

  private async guardarMensaje(
    manager: EntityManager,
    datos: {
      reporteId: number;
      autor: Usuario;
      esAdmin: boolean;
      cuerpo: string;
      adjunto: { nombre: string; mimeType: string; contenido: Buffer } | null;
    },
  ): Promise<MensajeSoporte> {
    const mensaje = await manager.save(
      manager.create(MensajeSoporte, {
        reporteId: datos.reporteId,
        autorId: datos.autor.id,
        autorNombre:
          `${datos.autor.nombre ?? ''} ${datos.autor.apellido ?? ''}`.trim() ||
          datos.autor.email,
        esAdmin: datos.esAdmin,
        cuerpo: datos.cuerpo,
      }),
    );

    if (datos.adjunto) {
      await manager.save(
        manager.create(AdjuntoSoporte, {
          mensajeId: mensaje.id,
          nombre: datos.adjunto.nombre,
          mimeType: datos.adjunto.mimeType,
          tamanio: datos.adjunto.contenido.length,
          contenido: datos.adjunto.contenido,
        }),
      );
    }

    return mensaje;
  }

  private validarImagen(imagen: ImagenSubida | undefined) {
    if (!imagen) return null;

    if (imagen.size > TAMANIO_MAXIMO_ADJUNTO) {
      throw new BadRequestException('La imagen no puede superar los 5 MB');
    }

    const mimeReal = detectarTipoDeImagen(imagen.buffer);
    if (!mimeReal) {
      throw new BadRequestException(
        'Solo se aceptan imagenes PNG, JPG, WEBP o GIF',
      );
    }

    const nombre = (imagen.originalname || 'captura')
      .replace(/[\r\n"]/g, '')
      .slice(0, 255);

    return { nombre, mimeType: mimeReal, contenido: imagen.buffer };
  }

  private async buscarReporte(reporteId: number): Promise<ReporteSoporte> {
    const reporte = await this.reporteRepository.findOne({
      where: { id: reporteId },
      relations: ['usuario'],
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return reporte;
  }

  private async componerVista(
    reporte: ReporteSoporte,
    comoAdmin: boolean,
  ): Promise<ReporteVista> {
    const mensajes = await this.mensajeRepository.find({
      where: { reporteId: reporte.id },
      relations: ['adjuntos'],
      order: { id: 'ASC' },
    });

    return {
      ...this.datosBase(reporte),
      noLeidos: this.contarNoLeidos(reporte, mensajes, comoAdmin),
      mensajes: mensajes.map((mensaje) => ({
        id: mensaje.id,
        cuerpo: mensaje.cuerpo,
        esAdmin: mensaje.esAdmin,
        autorNombre: mensaje.autorNombre,
        createdAt: mensaje.createdAt,
        adjuntos: (mensaje.adjuntos || []).map((adjunto) => ({
          id: adjunto.id,
          nombre: adjunto.nombre,
          mimeType: adjunto.mimeType,
          tamanio: adjunto.tamanio,
          url: `/api/soporte/adjunto/${adjunto.id}`,
        })),
      })),
    };
  }

  private datosBase(reporte: ReporteSoporte) {
    const nombre = `${reporte.usuario?.nombre ?? ''} ${
      reporte.usuario?.apellido ?? ''
    }`.trim();

    return {
      id: reporte.id,
      categoria: reporte.categoria,
      asunto: reporte.asunto,
      estado: reporte.estado,
      createdAt: reporte.createdAt,
      ultimoMensajeEn: reporte.ultimoMensajeEn,
      cerradoEn: reporte.cerradoEn,
      paginaOrigen: reporte.paginaOrigen,
      userAgent: reporte.userAgent,
      usuario: {
        id: reporte.usuario?.id ?? reporte.usuarioId,
        nombre: nombre || reporte.usuario?.email || 'Usuario',
        email: reporte.usuario?.email ?? '',
      },
    };
  }

  private contarNoLeidos(
    reporte: ReporteSoporte,
    mensajes: MensajeSoporte[],
    comoAdmin: boolean,
  ): number {
    const desde = comoAdmin
      ? reporte.ultimaLecturaAdmin
      : reporte.ultimaLecturaUsuario;

    return mensajes.filter((mensaje) => {
      if (mensaje.esAdmin === comoAdmin) return false;
      if (!desde) return true;
      return mensaje.createdAt > desde;
    }).length;
  }
}
