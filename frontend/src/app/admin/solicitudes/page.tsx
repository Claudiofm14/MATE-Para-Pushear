import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  usuarioService,
  SolicitudAcceso,
} from '../../../services/usuario.service';
import { useToast } from '../../../hooks';
import { Check, X, User, BookOpen, Calendar, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorComponent } from '../../../components/ErrorComponent';
import { Button } from '../../../shared/design-system/components/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import { PageTransition } from '../../../components/PageTransition';
import AuthStatus from '../../../components/AuthStatus';

export const AdminSolicitudesPage: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudAcceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialLoadStarted = useRef(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { auth, isInitialized } = useAuth();
  const isAdmin = auth?.hasRealmRole('admin') ?? false;

  const loadSolicitudes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usuarioService.obtenerSolicitudesAcceso();
      setSolicitudes(data);
    } catch (err: any) {
      const message =
        err?.response?.status === 429
          ? 'Demasiados intentos seguidos. Espera unos segundos y vuelve a intentar.'
          : err?.response?.data?.message || 'Error al cargar las solicitudes';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAdmin) {
      navigate('/');
      return;
    }

    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    loadSolicitudes();
  }, [isAdmin, isInitialized, navigate, loadSolicitudes]);

  const handleAprobar = async (id: number) => {
    setProcessingId(id);
    try {
      await usuarioService.aprobarSolicitudAcceso(id);
      toast.success('Solicitud aprobada');
      setSolicitudes(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error al aprobar:', error);
      toast.error('Error al aprobar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazar = async (id: number) => {
    if (!window.confirm('¿Estás seguro de rechazar esta solicitud?')) return;
    setProcessingId(id);
    try {
      await usuarioService.rechazarSolicitudAcceso(id);
      toast.success('Solicitud rechazada');
      setSolicitudes(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error al rechazar:', error);
      toast.error('Error al rechazar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Cargando solicitudes..." />;
  }

  return (
    <PageTransition className="app-page">
      <div className="app-page-container max-w-6xl">
        <div className="app-page-header mb-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/materias')}
              className="app-icon-button"
              aria-label="Volver a materias"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="app-page-title">Solicitudes de acceso docente</h1>
              <p className="app-page-description">
                Revisá y resolvé las solicitudes pendientes de los docentes.
              </p>
            </div>
          </div>
          <AuthStatus alwaysShow={true} />
        </div>

        {error ? (
          <ErrorComponent
            error={error}
            onRetry={loadSolicitudes}
            className="min-h-[420px]"
          />
        ) : solicitudes.length === 0 ? (
          <div className="app-empty-state min-h-[320px] p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/50">
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h3 className="mb-2 text-xl font-black text-slate-950 dark:text-white">
              Todo al día
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No hay solicitudes pendientes de revisión.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {solicitudes.map(solicitud => (
              <div
                key={solicitud.id}
                className="app-surface-interactive flex flex-col items-start justify-between gap-5 p-5 sm:p-6 md:flex-row md:items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      Pendiente
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(solicitud.createdAt).toLocaleDateString(
                        'es-AR',
                        { timeZone: 'America/Argentina/Buenos_Aires' }
                      )}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                      <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {solicitud.docente.nombre} {solicitud.docente.apellido}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {solicitud.docente.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-950/50">
                      <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {solicitud.materia.nombre}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Acceso docente completo a la materia
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => handleRechazar(solicitud.id)}
                    disabled={processingId === solicitud.id}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleAprobar(solicitud.id)}
                    disabled={processingId === solicitud.id}
                    loading={processingId === solicitud.id}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aprobar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};
