import { useState, useEffect, useCallback } from 'react';
import {
  ContratoPedagogico,
  UpdateContratoPedagogicoDto,
} from '../types/contrato-pedagogico.types';
import { contratoPedagogicoService } from '../services/contrato-pedagogico.service';

export const useContratoPedagogico = (id: number = 1) => {
  const [data, setData] = useState<ContratoPedagogico | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const contratoData =
        await contratoPedagogicoService.getContratoPedagogicoData(id);
      setData(contratoData);
      setError(null);
    } catch (err: any) {
      console.error('Error en useContratoPedagogico:', err);

      const status = err?.response?.status;
      const message = err?.message || '';

      if (status === 404 || message.includes('404')) {
        setError('404');
        setData(null);
      } else if (status === 403) {
        setError('403: No tienes permiso');
        setData(null);
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
        setData(null);
      } else if (message) {
        setError(message);
        setData(null);
      } else {
        setError('Error desconocido');
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [fetchData, id]);

  const actualizarContrato = async (dto: UpdateContratoPedagogicoDto) => {
    try {
      await contratoPedagogicoService.updateContrato(id, dto);
      await fetchData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al actualizar';
      setError(message);
      throw err;
    }
  };

  const crearContrato = async (dto: any) => {
    try {
      const created = await contratoPedagogicoService.createContrato(dto);
      setData(created);
      setError(null);
      return created;
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al crear';
      setError(message);
      throw err;
    }
  };

  const eliminarContrato = async () => {
    try {
      await contratoPedagogicoService.deleteContrato(id);
      setData(null);
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al eliminar';
      setError(message);
      throw err;
    }
  };

  const agregarSeccion = async (dto: any) => {
    try {
      await contratoPedagogicoService.addContenedor(id, dto);
      await fetchData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al agregar';
      setError(message);
      throw err;
    }
  };

  const eliminarSeccion = async (contenedorId: number) => {
    try {
      await contratoPedagogicoService.removeContenedor(id, contenedorId);
      await fetchData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al eliminar';
      setError(message);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    crearContrato,
    actualizarContrato,
    eliminarContrato,
    agregarSeccion,
    eliminarSeccion,
  };
};
