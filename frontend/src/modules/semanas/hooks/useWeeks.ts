import { useState, useEffect, useCallback } from 'react';
import { SemanaBackend } from '../types/semanas.types';
import { semanasService } from '../services/semanas.service';

interface UseWeeks {
  data: SemanaBackend[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useWeeks = (materiaId: string): UseWeeks => {
  const [data, setData] = useState<SemanaBackend[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSemanas = useCallback(async () => {
    if (!materiaId) return;

    try {
      setLoading(true);
      setError(null);
      const semanas = await semanasService.getSemanasMateria(materiaId);
      setData(semanas);
    } catch (err: any) {
      console.error('Error al cargar semanas:', err);
      setError(err.message || 'Error al cargar las semanas');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [materiaId]);

  useEffect(() => {
    fetchSemanas();
  }, [fetchSemanas]);

  return {
    data,
    loading,
    error,
    refetch: fetchSemanas,
  };
};
