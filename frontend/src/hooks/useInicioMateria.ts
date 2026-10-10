import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../shared/services/api.service';

interface Inicio {
  id: number;
  titulo: string;
  contenedores: any[];
  contenido?: any;
  materia: {
    id: number;
    nombre: string;
    codigo: string;
  };
}

interface UseInicioMateriaResult {
  inicio: Inicio | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const inicioMateriaCache = new Map<string, Inicio | null>();

/**
 * Hook para obtener el inicio de una materia específica
 * @param materiaId ID de la materia
 * @returns Datos del inicio, estado de carga, error y función de refetch
 */
export const useInicioMateria = (
  materiaId: string | undefined
): UseInicioMateriaResult => {
  const cachedInicio = materiaId
    ? inicioMateriaCache.get(materiaId)
    : undefined;
  const [inicio, setInicio] = useState<Inicio | null>(cachedInicio ?? null);
  const [loading, setLoading] = useState<boolean>(
    materiaId ? !inicioMateriaCache.has(materiaId) : true
  );
  const [error, setError] = useState<string | null>(null);

  const fetchInicio = useCallback(async () => {
    if (!materiaId) {
      setError('No se proporcionó ID de materia');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get<Inicio>(`/inicio/materia/${materiaId}`);
      inicioMateriaCache.set(materiaId, data);
      setInicio(data);
    } catch (err: any) {
      console.error('Error fetching inicio:', err);
      if (err.response?.status === 403) {
        setError('FORBIDDEN');
      } else if (err.response?.status === 404) {
        inicioMateriaCache.set(materiaId, null);
        setInicio(null);
        setError('No se encontró un inicio para esta materia');
      } else {
        setError(err.message || 'Error al cargar el inicio de la materia');
      }
    } finally {
      setLoading(false);
    }
  }, [materiaId]);

  useEffect(() => {
    fetchInicio();
  }, [fetchInicio]);

  return {
    inicio,
    loading,
    error,
    refetch: fetchInicio,
  };
};
