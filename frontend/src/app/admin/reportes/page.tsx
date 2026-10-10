import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Inbox,
  Loader2,
  LockOpen,
  MessageSquare,
  Monitor,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import { PageTransition } from '../../../components/PageTransition';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorComponent } from '../../../components/ErrorComponent';
import AuthStatus from '../../../components/AuthStatus';
import { ConversacionSoporte } from '../../../components/soporte/ConversacionSoporte';
import { useToast } from '../../../hooks';
import { useAuth } from '../../auth/contexts/AuthContext';
import {
  CATEGORIAS_SOPORTE,
  ETIQUETAS_CATEGORIA,
  ReporteResumen,
  ReporteSoporte,
  SoporteCategoria,
  SoporteEstado,
  soporteService,
} from '../../../services/soporte.service';

const TAMANIO_MAXIMO = 5 * 1024 * 1024;

const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function mensajeDeError(error: any, porDefecto: string): string {
  const detalle = error?.response?.data?.message;
  if (Array.isArray(detalle)) return detalle[0] ?? porDefecto;
  return typeof detalle === 'string' ? detalle : porDefecto;
}

const AdminReportesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { auth, isInitialized } = useAuth();
  const isAdmin = auth?.hasRealmRole('admin') ?? false;

  const [reportes, setReportes] = useState<ReporteResumen[]>([]);
  const [seleccionado, setSeleccionado] = useState<ReporteSoporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoHilo, setCargandoHilo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<SoporteEstado | 'todos'>(
    'abierto'
  );
  const [filtroCategoria, setFiltroCategoria] = useState<
    SoporteCategoria | 'todas'
  >('todas');

  const [mensaje, setMensaje] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const inputArchivo = useRef<HTMLInputElement | null>(null);

  const cargarReportes = useCallback(async () => {
    setError(null);
    try {
      const datos = await soporteService.listar({
        estado: filtroEstado === 'todos' ? undefined : filtroEstado,
        categoria: filtroCategoria === 'todas' ? undefined : filtroCategoria,
      });
      setReportes(datos);
    } catch (err: any) {
      setError(mensajeDeError(err, 'No se pudieron cargar los reportes'));
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, filtroCategoria]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAdmin) {
      navigate('/materias');
      return;
    }
    setCargando(true);
    cargarReportes();
  }, [isInitialized, isAdmin, navigate, cargarReportes]);

  const abrirReporte = async (id: number) => {
    setCargandoHilo(true);
    try {
      const detalle = await soporteService.detalle(id);
      setSeleccionado(detalle);
      setMensaje('');
      setImagen(null);

      if (detalle.noLeidos > 0) {
        await soporteService.marcarLeidoComoAdmin(id);
        setReportes(prev =>
          prev.map(item => (item.id === id ? { ...item, noLeidos: 0 } : item))
        );
      }
    } catch (err: any) {
      toast.error(mensajeDeError(err, 'No se pudo abrir el reporte'));
    } finally {
      setCargandoHilo(false);
    }
  };

  const elegirImagen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0] ?? null;
    if (!archivo) {
      setImagen(null);
      return;
    }
    if (!archivo.type.startsWith('image/')) {
      toast.error('Solo se pueden adjuntar imágenes');
      event.target.value = '';
      return;
    }
    if (archivo.size > TAMANIO_MAXIMO) {
      toast.error('La imagen no puede superar los 5 MB');
      event.target.value = '';
      return;
    }
    setImagen(archivo);
  };

  const responder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!seleccionado || (!mensaje.trim() && !imagen)) return;

    setEnviando(true);
    try {
      const actualizado = await soporteService.responderComoAdmin(
        seleccionado.id,
        mensaje.trim(),
        imagen
      );
      setSeleccionado(actualizado);
      setMensaje('');
      setImagen(null);
      if (inputArchivo.current) inputArchivo.current.value = '';
      await cargarReportes();
    } catch (err: any) {
      toast.error(mensajeDeError(err, 'No se pudo enviar la respuesta'));
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (cerrar: boolean) => {
    if (!seleccionado) return;

    setEnviando(true);
    try {
      const actualizado = cerrar
        ? await soporteService.cerrar(seleccionado.id)
        : await soporteService.reabrir(seleccionado.id);
      setSeleccionado(actualizado);
      await cargarReportes();
      toast.success(
        cerrar
          ? 'Reporte cerrado. El usuario deja de verlo al confirmarlo.'
          : 'Reporte reabierto'
      );
    } catch (err: any) {
      toast.error(mensajeDeError(err, 'No se pudo actualizar el reporte'));
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return <LoadingSpinner fullScreen label="Cargando reportes..." />;
  }

  const pendientes = reportes.filter(item => item.esperandoRespuesta).length;

  return (
    <PageTransition className="app-page">
      <div className="app-page-container max-w-7xl">
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
              <h1 className="app-page-title">Reportes de usuarios</h1>
              <p className="app-page-description">
                Bugs, ideas y detalles visuales que reportan desde el botón de
                soporte.
                {pendientes > 0 && (
                  <span className="ml-1 font-bold text-amber-600 dark:text-amber-300">
                    {pendientes} esperando respuesta.
                  </span>
                )}
              </p>
            </div>
          </div>
          <AuthStatus alwaysShow={true} />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(['abierto', 'cerrado', 'todos'] as const).map(estado => (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltroEstado(estado)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                filtroEstado === estado
                  ? 'border-cyan-400 bg-cyan-50 text-cyan-900 dark:border-cyan-300/40 dark:bg-cyan-400/10 dark:text-cyan-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {estado === 'todos' ? 'Todos' : `${estado}s`}
            </button>
          ))}

          <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-white/10" />

          <button
            type="button"
            onClick={() => setFiltroCategoria('todas')}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              filtroCategoria === 'todas'
                ? 'border-cyan-400 bg-cyan-50 text-cyan-900 dark:border-cyan-300/40 dark:bg-cyan-400/10 dark:text-cyan-100'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            Todas
          </button>
          {CATEGORIAS_SOPORTE.map(opcion => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setFiltroCategoria(opcion.valor)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                filtroCategoria === opcion.valor
                  ? 'border-cyan-400 bg-cyan-50 text-cyan-900 dark:border-cyan-300/40 dark:bg-cyan-400/10 dark:text-cyan-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {opcion.emoji} {opcion.etiqueta}
            </button>
          ))}

          <button
            type="button"
            onClick={cargarReportes}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>

        {error ? (
          <ErrorComponent
            error={error}
            onRetry={cargarReportes}
            className="min-h-[420px]"
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
              {reportes.length === 0 ? (
                <div className="app-empty-state p-10">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/50">
                    <Inbox className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <h3 className="mb-2 text-lg font-black text-slate-950 dark:text-white">
                    Sin reportes
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    No hay reportes con estos filtros.
                  </p>
                </div>
              ) : (
                reportes.map(reporte => (
                  <button
                    key={reporte.id}
                    type="button"
                    onClick={() => abrirReporte(reporte.id)}
                    className={`app-surface-interactive w-full p-4 text-left transition ${
                      seleccionado?.id === reporte.id
                        ? 'ring-2 ring-cyan-400/70'
                        : ''
                    }`}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.68rem] font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        {ETIQUETAS_CATEGORIA[reporte.categoria]}
                      </span>
                      {reporte.estado === 'cerrado' ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.68rem] font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                          Cerrado
                        </span>
                      ) : reporte.esperandoRespuesta ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-bold text-amber-700 dark:border-amber-300/20 dark:bg-amber-500/10 dark:text-amber-200">
                          Esperando respuesta
                        </span>
                      ) : null}
                      {reporte.noLeidos > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.68rem] font-black text-white">
                          {reporte.noLeidos}
                        </span>
                      )}
                    </div>
                    <p className="overflow-wrap-anywhere font-black text-slate-900 dark:text-white">
                      {reporte.asunto}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {reporte.usuario.nombre} · {reporte.usuario.email}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-semibold text-slate-400 dark:text-slate-500">
                      <MessageSquare className="h-3 w-3" />
                      {reporte.cantidadMensajes} ·{' '}
                      {formatoFecha.format(new Date(reporte.ultimoMensajeEn))}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="app-surface-interactive flex min-h-[32rem] flex-col overflow-hidden p-0">
              {cargandoHilo ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : !seleccionado ? (
                <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                  <MessageSquare className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Elegí un reporte para ver la conversación.
                  </p>
                </div>
              ) : (
                <>
                  <header className="border-b border-slate-200 p-5 dark:border-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="overflow-wrap-anywhere text-lg font-black text-slate-950 dark:text-white">
                          {seleccionado.asunto}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {seleccionado.usuario.nombre} ·{' '}
                          {seleccionado.usuario.email}
                        </p>
                      </div>
                      {seleccionado.estado === 'abierto' ? (
                        <button
                          type="button"
                          onClick={() => cambiarEstado(true)}
                          disabled={enviando}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-300/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Cerrar reporte
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => cambiarEstado(false)}
                          disabled={enviando}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                        >
                          <LockOpen className="h-4 w-4" />
                          Reabrir
                        </button>
                      )}
                    </div>

                    {(seleccionado.paginaOrigen || seleccionado.userAgent) && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] font-semibold text-slate-400 dark:text-slate-500">
                        {seleccionado.paginaOrigen && (
                          <span className="inline-flex items-center gap-1.5">
                            <Monitor className="h-3 w-3" />
                            {seleccionado.paginaOrigen}
                          </span>
                        )}
                        {seleccionado.userAgent && (
                          <span className="max-w-full truncate">
                            {seleccionado.userAgent}
                          </span>
                        )}
                      </div>
                    )}
                  </header>

                  <div className="flex-1 overflow-y-auto bg-slate-50 p-5 dark:bg-slate-950/40">
                    <ConversacionSoporte
                      mensajes={seleccionado.mensajes}
                      ladoAdmin={true}
                    />
                  </div>

                  {seleccionado.estado === 'abierto' ? (
                    <form
                      onSubmit={responder}
                      className="border-t border-slate-200 p-4 dark:border-white/10"
                    >
                      {imagen && (
                        <p className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                          <span className="truncate">{imagen.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setImagen(null);
                              if (inputArchivo.current)
                                inputArchivo.current.value = '';
                            }}
                            className="shrink-0 text-slate-400 hover:text-red-500"
                            aria-label="Quitar imagen"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </p>
                      )}
                      <div className="flex items-end gap-2">
                        <textarea
                          value={mensaje}
                          onChange={event => setMensaje(event.target.value)}
                          rows={2}
                          maxLength={4000}
                          placeholder="Escribí la respuesta..."
                          className="min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => inputArchivo.current?.click()}
                          className="rounded-2xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-cyan-600 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                          aria-label="Adjuntar captura"
                        >
                          <ImagePlus className="h-4 w-4" />
                        </button>
                        <button
                          type="submit"
                          disabled={enviando || (!mensaje.trim() && !imagen)}
                          className="rounded-2xl bg-cyan-500 p-2.5 text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-950"
                          aria-label="Enviar respuesta"
                        >
                          {enviando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="border-t border-slate-200 p-4 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
                      Reporte cerrado
                      {seleccionado.cerradoEn
                        ? ` el ${formatoFecha.format(new Date(seleccionado.cerradoEn))}`
                        : ''}
                      . Reabrilo para seguir la conversación.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <input
          ref={inputArchivo}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={elegirImagen}
          className="hidden"
        />
      </div>
    </PageTransition>
  );
};

export default AdminReportesPage;
