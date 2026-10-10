import { useCallback, useEffect, useState } from 'react';
import {
  MateriaConfig,
  materiaConfigService,
  mergeMateriaConfig,
} from '../services/materia-config.service';

export const useMateriaConfig = (materiaId?: number | null) => {
  const [config, setConfig] = useState<MateriaConfig>(mergeMateriaConfig());
  const [loading, setLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!materiaId) {
      setConfig(mergeMateriaConfig());
      return;
    }

    setLoading(true);
    try {
      const data = await materiaConfigService.getConfig(materiaId);
      setConfig(data);
    } catch (error) {
      console.error('Error al cargar configuracion de materia:', error);
      setConfig(mergeMateriaConfig());
    } finally {
      setLoading(false);
    }
  }, [materiaId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return { config, loading, refetch: loadConfig, setConfig };
};

export default useMateriaConfig;
