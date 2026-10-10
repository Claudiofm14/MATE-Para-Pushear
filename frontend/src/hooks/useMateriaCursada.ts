import { useEffect, useState } from 'react';
import { cursadaService, Cursada } from '../services';

export function useMateriaCursada(materiaId?: number | null) {
  const [cursada, setCursada] = useState<Cursada | null>(null);
  const [loading, setLoading] = useState(Boolean(materiaId));

  useEffect(() => {
    let cancelled = false;

    async function loadCursada() {
      if (!materiaId) {
        setCursada(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const cursadas = await cursadaService.getByMateria(materiaId);
        const selected = cursadas.find(c => c.activa) || cursadas[0] || null;
        if (!cancelled) setCursada(selected);
      } catch (error) {
        console.error('Error al cargar cursada de materia:', error);
        if (!cancelled) setCursada(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCursada();

    return () => {
      cancelled = true;
    };
  }, [materiaId]);

  return {
    cursada,
    cursadaId: cursada?.id || 0,
    loadingCursada: loading,
  };
}

export default useMateriaCursada;
