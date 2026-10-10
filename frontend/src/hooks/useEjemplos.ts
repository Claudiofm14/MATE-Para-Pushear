import { useState, useEffect } from 'react';
import {
  Ejemplo,
  CreateEjemploDto,
  UpdateEjemploDto,
} from '../types/ejemplo.types';
import { ejemploService } from '../services/ejemplo.service';

interface UseEjemplosReturn {
  ejemplos: Ejemplo[];
  loading: boolean;
  error: string | null;
  createEjemplo: (data: CreateEjemploDto) => Promise<void>;
  updateEjemplo: (id: number, data: UpdateEjemploDto) => Promise<void>;
  deleteEjemplo: (id: number) => Promise<void>;
  refreshEjemplos: () => Promise<void>;
}

export const useEjemplos = (): UseEjemplosReturn => {
  const [ejemplos, setEjemplos] = useState<Ejemplo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEjemplos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ejemploService.getAll();
      setEjemplos(data);
    } catch (err) {
      setError('Error al cargar los ejemplos');
      console.error('Error fetching ejemplos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEjemplo = async (data: CreateEjemploDto) => {
    try {
      setError(null);
      const newEjemplo = await ejemploService.create(data);
      setEjemplos(prev => [...prev, newEjemplo]);
    } catch (err) {
      setError('Error al crear el ejemplo');
      console.error('Error creating ejemplo:', err);
      throw err;
    }
  };

  const updateEjemplo = async (id: number, data: UpdateEjemploDto) => {
    try {
      setError(null);
      const updatedEjemplo = await ejemploService.update(id, data);
      setEjemplos(prev =>
        prev.map(ejemplo => (ejemplo.id === id ? updatedEjemplo : ejemplo))
      );
    } catch (err) {
      setError('Error al actualizar el ejemplo');
      console.error('Error updating ejemplo:', err);
      throw err;
    }
  };

  const deleteEjemplo = async (id: number) => {
    try {
      setError(null);
      await ejemploService.delete(id);
      setEjemplos(prev => prev.filter(ejemplo => ejemplo.id !== id));
    } catch (err) {
      setError('Error al eliminar el ejemplo');
      console.error('Error deleting ejemplo:', err);
      throw err;
    }
  };

  const refreshEjemplos = async () => {
    await fetchEjemplos();
  };

  useEffect(() => {
    fetchEjemplos();
  }, []);

  return {
    ejemplos,
    loading,
    error,
    createEjemplo,
    updateEjemplo,
    deleteEjemplo,
    refreshEjemplos,
  };
};
