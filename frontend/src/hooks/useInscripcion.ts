import { useState, useEffect, useCallback } from 'react';
import {
  usuarioService,
  EstadoInscripcion,
  AlumnoMateria,
} from '../services/usuario.service';

export function useEstadoInscripcion(
  materiaId: number | null,
  cursadaId?: number | null
) {
  const [estado, setEstado] = useState<EstadoInscripcion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verificarEstado = useCallback(async () => {
    if (!materiaId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await usuarioService.verificarEstadoInscripcion(
        materiaId,
        cursadaId || undefined
      );
      setEstado(result);
    } catch (err: any) {
      setError(err.message || 'Error al verificar estado de inscripción');
      console.error('Error al verificar estado:', err);
    } finally {
      setLoading(false);
    }
  }, [materiaId, cursadaId]);

  useEffect(() => {
    verificarEstado();
  }, [verificarEstado]);

  return {
    estado,
    loading,
    error,
    refetch: verificarEstado,
  };
}

export function useSolicitudInscripcion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const solicitarInscripcion = async (
    materiaId: number,
    comisionId: number
  ): Promise<AlumnoMateria | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await usuarioService.solicitarInscripcion({
        materiaId,
        comisionId,
      });
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al solicitar inscripción');
      console.error('Error al solicitar inscripción:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    solicitarInscripcion,
    loading,
    error,
  };
}

export function useMisMaterias() {
  const [materias, setMaterias] = useState<AlumnoMateria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMaterias = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await usuarioService.obtenerMateriasAprobadas();
      setMaterias(result);
    } catch (err: any) {
      setError(err.message || 'Error al cargar materias');
      console.error('Error al cargar materias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarMaterias();
  }, [cargarMaterias]);

  return {
    materias,
    loading,
    error,
    refetch: cargarMaterias,
  };
}

export function useSolicitudesPendientes() {
  const [solicitudes, setSolicitudes] = useState<AlumnoMateria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarSolicitudes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await usuarioService.obtenerSolicitudesPendientes();
      setSolicitudes(result);
    } catch (err: any) {
      setError(err.message || 'Error al cargar solicitudes');
      console.error('Error al cargar solicitudes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  return {
    solicitudes,
    loading,
    error,
    refetch: cargarSolicitudes,
  };
}
