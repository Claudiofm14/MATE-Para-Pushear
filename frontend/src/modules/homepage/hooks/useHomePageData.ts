import { useState, useEffect } from 'react';
import { HomePageData } from '../types/home.types';
import { useInicio } from './useInicio';
import { transformBackendToFrontend } from '../utils/dataTransform';

interface UseHomePageData {
  data: HomePageData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener los datos de la homepage desde el backend
 * Solo carga datos si el usuario está autenticado
 */
export const useHomePageData = (): UseHomePageData => {
  const { data: inicioData, loading, error, refetch } = useInicio();
  const [data, setData] = useState<HomePageData | null>(null);

  useEffect(() => {
    if (inicioData) {
      const transformedData = transformBackendToFrontend(inicioData);
      setData(transformedData);
    } else {
      setData(null);
    }
  }, [inicioData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};
