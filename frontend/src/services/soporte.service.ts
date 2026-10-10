import { apiService } from '../shared/services/api.service';

export type SoporteCategoria = 'bug' | 'funcionalidad' | 'estetico' | 'otro';
export type SoporteEstado = 'abierto' | 'cerrado';

export interface AdjuntoSoporte {
  id: number;
  nombre: string;
  mimeType: string;
  tamanio: number;
  url: string;
}

export interface MensajeSoporte {
  id: number;
  cuerpo: string;
  esAdmin: boolean;
  autorNombre: string;
  createdAt: string;
  adjuntos: AdjuntoSoporte[];
}

export interface ReporteSoporte {
  id: number;
  categoria: SoporteCategoria;
  asunto: string;
  estado: SoporteEstado;
  createdAt: string;
  ultimoMensajeEn: string;
  cerradoEn: string | null;
  paginaOrigen: string | null;
  userAgent: string | null;
  usuario: { id: number; nombre: string; email: string };
  mensajes: MensajeSoporte[];
  noLeidos: number;
}

export type ReporteResumen = Omit<ReporteSoporte, 'mensajes'> & {
  ultimoMensaje: string;
  cantidadMensajes: number;
  esperandoRespuesta: boolean;
};

export interface MiResumenSoporte {
  tieneHilo: boolean;
  estado: SoporteEstado | null;
  noLeidos: number;
}

export interface NuevoReporte {
  categoria: SoporteCategoria;
  asunto: string;
  mensaje: string;
  paginaOrigen?: string;
}

export const CATEGORIAS_SOPORTE: Array<{
  valor: SoporteCategoria;
  etiqueta: string;
  emoji: string;
}> = [
  { valor: 'bug', etiqueta: 'Algo no funciona', emoji: '🐞' },
  { valor: 'funcionalidad', etiqueta: 'Nueva idea', emoji: '✨' },
  { valor: 'estetico', etiqueta: 'Detalle visual', emoji: '🎨' },
  { valor: 'otro', etiqueta: 'Otra cosa', emoji: '💬' },
];

export const ETIQUETAS_CATEGORIA: Record<SoporteCategoria, string> =
  CATEGORIAS_SOPORTE.reduce(
    (acc, item) => ({ ...acc, [item.valor]: item.etiqueta }),
    {} as Record<SoporteCategoria, string>
  );

/**
 * El backend responde con cuerpo vacio cuando el usuario no tiene ningun hilo
 * visible; axios lo entrega como '' o {}.
 */
function normalizarReporte(dato: unknown): ReporteSoporte | null {
  if (!dato || typeof dato !== 'object') return null;
  const reporte = dato as ReporteSoporte;
  return reporte.id ? reporte : null;
}

function construirFormData(
  campos: Record<string, string | undefined>,
  imagen?: File | null
): FormData {
  const formData = new FormData();
  Object.entries(campos).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== '') formData.append(clave, valor);
  });
  if (imagen) formData.append('imagen', imagen);
  return formData;
}

class SoporteService {
  // --- Usuario ---

  async miReporte(): Promise<ReporteSoporte | null> {
    const respuesta = await apiService.get<ReporteSoporte | null>(
      '/api/soporte/mi-reporte'
    );
    return normalizarReporte(respuesta);
  }

  async miResumen(): Promise<MiResumenSoporte> {
    return apiService.get<MiResumenSoporte>('/api/soporte/mi-resumen');
  }

  async crear(
    datos: NuevoReporte,
    imagen?: File | null
  ): Promise<ReporteSoporte> {
    return apiService.post<ReporteSoporte>(
      '/api/soporte',
      construirFormData(
        {
          categoria: datos.categoria,
          asunto: datos.asunto,
          mensaje: datos.mensaje,
          paginaOrigen: datos.paginaOrigen,
        },
        imagen
      )
    );
  }

  async responder(
    mensaje: string,
    imagen?: File | null
  ): Promise<ReporteSoporte> {
    return apiService.post<ReporteSoporte>(
      '/api/soporte/mi-reporte/mensajes',
      construirFormData({ mensaje }, imagen)
    );
  }

  async marcarLeido(): Promise<void> {
    await apiService.patch('/api/soporte/mi-reporte/leido');
  }

  /**
   * Las imagenes se piden por XHR con las credenciales de la sesion y se
   * muestran como object URL: un <img src> directo no llevaria la cookie.
   */
  async descargarAdjunto(url: string): Promise<Blob> {
    return apiService.get<Blob>(url, { responseType: 'blob' });
  }

  // --- Admin ---

  async listar(filtros?: {
    estado?: SoporteEstado;
    categoria?: SoporteCategoria;
  }): Promise<ReporteResumen[]> {
    const params = new URLSearchParams();
    if (filtros?.estado) params.set('estado', filtros.estado);
    if (filtros?.categoria) params.set('categoria', filtros.categoria);
    const query = params.toString();

    return apiService.get<ReporteResumen[]>(
      `/api/soporte${query ? `?${query}` : ''}`
    );
  }

  async detalle(id: number): Promise<ReporteSoporte> {
    return apiService.get<ReporteSoporte>(`/api/soporte/${id}`);
  }

  async responderComoAdmin(
    id: number,
    mensaje: string,
    imagen?: File | null
  ): Promise<ReporteSoporte> {
    return apiService.post<ReporteSoporte>(
      `/api/soporte/${id}/mensajes`,
      construirFormData({ mensaje }, imagen)
    );
  }

  async cerrar(id: number): Promise<ReporteSoporte> {
    return apiService.patch<ReporteSoporte>(`/api/soporte/${id}/cerrar`);
  }

  async reabrir(id: number): Promise<ReporteSoporte> {
    return apiService.patch<ReporteSoporte>(`/api/soporte/${id}/reabrir`);
  }

  async marcarLeidoComoAdmin(id: number): Promise<void> {
    await apiService.patch(`/api/soporte/${id}/leido`);
  }
}

export const soporteService = new SoporteService();
