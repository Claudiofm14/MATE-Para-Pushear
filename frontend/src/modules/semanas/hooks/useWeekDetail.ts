import { useState, useEffect, useCallback } from 'react';
import { SemanaBackend } from '../types/semanas.types';
import { semanasService } from '../services/semanas.service';

interface UseWeekDetail {
  data: SemanaBackend | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useWeekDetail = (
  materiaId: string,
  semanaId: string
): UseWeekDetail => {
  const [data, setData] = useState<SemanaBackend | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSemanaDetail = useCallback(async () => {
    if (!materiaId || !semanaId) return;

    try {
      setLoading(true);
      setError(null);
      const semana = await semanasService.getSemanaDetail(materiaId, semanaId);
      setData(semana);
    } catch (err: any) {
      console.error('Error al cargar detalle de semana:', err);
      setError(err.message || 'Error al cargar el detalle de la semana');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [materiaId, semanaId]);

  useEffect(() => {
    fetchSemanaDetail();
  }, [fetchSemanaDetail]);

  return {
    data,
    loading,
    error,
    refetch: fetchSemanaDetail,
  };
};
