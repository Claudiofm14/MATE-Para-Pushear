import { useState, useEffect } from 'react';
import { Inicio } from '../types/home.types';
import { homeService } from '../services/home.service';

interface UseInicio {
  data: Inicio | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para manejar los datos de inicio de la materia desde el backend
 */
export const useInicio = (): UseInicio => {
  const [data, setData] = useState<Inicio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const inicioData = await homeService.getMateriaInicio();
      setData(inicioData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar los datos'
      );
      console.error('Error loading inicio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = async () => {
    await fetchData();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
};

export {};
