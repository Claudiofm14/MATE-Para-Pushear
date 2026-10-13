import { apiClient } from './api.client';

const CONFIG_CACHE_TTL_MS = 60_000;
const configCache = new Map<
  number,
  { value: MateriaConfig; expiresAt: number }
>();
const configRequests = new Map<number, Promise<MateriaConfig>>();

export type MateriaTabKey =
  | 'inicio'
  | 'material'
  | 'videos'
  | 'semanas'
  | 'avance'
  | 'cronograma'
  | 'misAlumnos'
  | 'planilla'
  | 'contratoPedagogico'
  | 'logs'
  | 'configuracion';

export interface PageHeaderConfig {
  titulo?: string;
  descripcion?: string;
}

export interface MateriaConfig {
  tabs: Record<MateriaTabKey, boolean>;
  pages: Record<string, PageHeaderConfig>;
}

export interface MateriaLog {
  id: number;
  materiaId: number;
  actorNombre?: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  title: string;
  detail?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export const defaultMateriaConfig: MateriaConfig = {
  tabs: {
    inicio: true,
    material: true,
    videos: true,
    semanas: true,
    avance: true,
    cronograma: true,
    misAlumnos: true,
    planilla: true,
    contratoPedagogico: true,
    logs: true,
    configuracion: true,
  },
  pages: {
    inicio: { titulo: '', descripcion: '' },
    material: {
      titulo: 'Material Académico',
      descripcion: 'Recursos y contenidos para acompañar la cursada.',
    },
    videos: {
      titulo: 'Videos',
      descripcion:
        'Videotutoriales y guías paso a paso para complementar tu aprendizaje.',
    },
    semanas: {
      titulo: 'Semanas',
      descripcion: 'Gestiona las semanas de la cursada',
    },
    cronograma: {
      titulo: 'Cronograma',
      descripcion: 'Clases y actividades de la cursada.',
    },
    avance: {
      titulo: 'Avance de Cursada',
      descripcion:
        'Visualizá el mapa de la materia. Las actividades y trabajos prácticos se irán habilitando a medida que completes cada entrega.',
    },
    misAlumnos: {
      titulo: 'Mis Alumnos',
      descripcion: 'Solicitudes, comisiones y estudiantes de la materia.',
    },
    planilla: {
      titulo: 'Planilla de Seguimiento',
      descripcion: 'Actividades y entregas de la cursada.',
    },
    contratoPedagogico: {
      titulo: 'Contrato Pedagógico',
      descripcion:
        'Documentos y acuerdos relacionados con el contrato pedagógico.',
    },
  },
};

export const mergeMateriaConfig = (
  config?: Partial<MateriaConfig> | null
): MateriaConfig => ({
  ...defaultMateriaConfig,
  ...(config || {}),
  tabs: {
    ...defaultMateriaConfig.tabs,
    ...(config?.tabs || {}),
  },
  pages: {
    ...defaultMateriaConfig.pages,
    ...(config?.pages || {}),
  },
});

export const materiaConfigService = {
  async getConfig(materiaId: number): Promise<MateriaConfig> {
    const cached = configCache.get(materiaId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const pending = configRequests.get(materiaId);
    if (pending) return pending;

    const request = apiClient
      .get<MateriaConfig>(`/materia/${materiaId}/configuracion`)
      .then(response => {
        const value = mergeMateriaConfig(response.data);
        configCache.set(materiaId, {
          value,
          expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
        });
        return value;
      })
      .finally(() => configRequests.delete(materiaId));

    configRequests.set(materiaId, request);
    return request;
  },

  async updateConfig(
    materiaId: number,
    config: Partial<MateriaConfig>
  ): Promise<MateriaConfig> {
    const response = await apiClient.put<MateriaConfig>(
      `/materia/${materiaId}/configuracion`,
      config
    );
    const value = mergeMateriaConfig(response.data);
    configCache.set(materiaId, {
      value,
      expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
    });
    return value;
  },

  async getLogs(materiaId: number): Promise<MateriaLog[]> {
    const response = await apiClient.get<MateriaLog[]>(
      `/materia/${materiaId}/logs`
    );
    return response.data;
  },
};

export default materiaConfigService;
