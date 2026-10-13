import { apiClient } from './api.client';

export interface NodoAvance {
  id: number;
  titulo: string;
  descripcion: string;
  semanaId: number;
  numeroSemana: number;
  semanaTitulo: string;
  fechaEntrega?: string;
  recursoUrl?: string;
  recursoTitulo?: string;
  tipoActividad?: string;
  requisitos: number[];
  completadoEn: string | null;
  estado: 'entregado' | 'pendiente' | 'bloqueado';
}

export interface MapaAvance {
  materia: { id: number; nombre: string; codigo?: string };
  cursada: { id: number; titulo: string };
  comisionId: number | null;
  simulacion: boolean;
  nodos: NodoAvance[];
}

export function recalcularAvance(mapa: MapaAvance): MapaAvance {
  const completadas = new Set(
    mapa.nodos.filter(nodo => nodo.completadoEn).map(nodo => nodo.id)
  );
  return {
    ...mapa,
    nodos: mapa.nodos.map(nodo => ({
      ...nodo,
      estado: nodo.completadoEn
        ? 'entregado'
        : nodo.requisitos.every(id => completadas.has(id))
          ? 'pendiente'
          : 'bloqueado',
    })),
  };
}

export const avanceService = {
  async obtener(cursadaId: number, comisionId?: number): Promise<MapaAvance> {
    const response = await apiClient.get<MapaAvance>(
      `/avance/cursada/${cursadaId}`,
      {
        params: comisionId ? { comisionId } : undefined,
      }
    );
    return response.data;
  },
  async completar(cursadaId: number, ejercicioId: number): Promise<MapaAvance> {
    const response = await apiClient.put<MapaAvance>(
      `/avance/cursada/${cursadaId}/ejercicio/${ejercicioId}`
    );
    return response.data;
  },
  async reiniciar(cursadaId: number): Promise<MapaAvance> {
    const response = await apiClient.delete<MapaAvance>(
      `/avance/cursada/${cursadaId}/completadas`
    );
    return response.data;
  },
};
