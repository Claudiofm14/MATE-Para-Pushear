import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  ImagePlus,
  LifeBuoy,
  Loader2,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '../../app/auth/contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  CATEGORIAS_SOPORTE,
  MiResumenSoporte,
  ReporteSoporte,
  SoporteCategoria,
  soporteService,
} from '../../services/soporte.service';
import { ConversacionSoporte } from './ConversacionSoporte';

const TAMANIO_MAXIMO = 5 * 1024 * 1024;
const INTERVALO_RESUMEN = 45_000;
const INTERVALO_HILO = 10_000;

function mensajeDeError(error: any, porDefecto: string): string {
  const detalle = error?.response?.data?.message;
  if (Array.isArray(detalle)) return detalle[0] ?? porDefecto;
  return typeof detalle === 'string' ? detalle : porDefecto;
}

/**
 * Boton flotante de soporte: el usuario abre un hilo con los administradores
 * y conversa hasta que ellos lo cierran. Mientras haya uno en curso no puede
 * abrir otro.
 */
export const SoporteWidget: React.FC = () => {
  const { authenticated, isInitialized } = useAuth();
  const location = useLocation();
  const toast = useToast();

  const [abierto, setAbierto] = useState(false);
  const [resumen, setResumen] = useState<MiResumenSoporte | null>(null);
  const [hilo, setHilo] = useState<ReporteSoporte | null>(null);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [categoria, setCategoria] = useState<SoporteCategoria>('bug');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);

  const inputArchivo = useRef<HTMLInputElement | null>(null);
  const visible = isInitialized && authenticated;

  const limpiarFormulario = useCallback(() => {
    setAsunto('');
    setMensaje('');
    setImagen(null);
    setCategoria('bug');
    if (inputArchivo.current) inputArchivo.current.value = '';
  }, []);

  const refrescarResumen = useCallback(async () => {
    try {
      setResumen(await soporteService.miResumen());
    } catch {
      // El widget es accesorio: si falla no molesta al usuario.
    }
  }, []);

  const cargarHilo = useCallback(async () => {
    try {
      const actual = await soporteService.miReporte();
      setHilo(actual);

      // Un hilo cerrado se marca leido recien cuando el usuario lo confirma,
      // asi no pierde la ultima respuesta del equipo.
      if (actual && actual.estado === 'abierto' && actual.noLeidos > 0) {
        await soporteService.marcarLeido();
        setResumen(prev => (prev ? { ...prev, noLeidos: 0 } : prev));
      }
    } catch {
      setHilo(null);
    }
  }, []);

  // Contador del boton, mientras el panel esta cerrado.
  useEffect(() => {
    if (!visible) return;

    refrescarResumen();
    const intervalo = window.setInterval(refrescarResumen, INTERVALO_RESUMEN);
    return () => window.clearInterval(intervalo);
  }, [visible, refrescarResumen]);

  // Con el panel abierto se sigue la conversacion mas de cerca.
  useEffect(() => {
    if (!visible || !abierto) return;

    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      await cargarHilo();
      if (!cancelado) setCargando(false);
    };

    cargar();
    const intervalo = window.setInterval(cargarHilo, INTERVALO_HILO);
    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
    };
  }, [visible, abierto, cargarHilo]);

  if (!visible) return null;

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

  const crearReporte = async (event: React.FormEvent) => {
    event.preventDefault();
    if (asunto.trim().length < 3) {
      toast.error('Contanos en pocas palabras de qué se trata');
      return;
    }
    if (!mensaje.trim()) {
      toast.error('Escribí un poco más de detalle');
      return;
    }

    setEnviando(true);
    try {
      const creado = await soporteService.crear(
        {
          categoria,
          asunto: asunto.trim(),
          mensaje: mensaje.trim(),
          paginaOrigen: location.pathname,
        },
        imagen
      );
      setHilo(creado);
      limpiarFormulario();
      await refrescarResumen();
      toast.success('Reporte enviado. Te respondemos por acá.');
    } catch (error) {
      toast.error(mensajeDeError(error, 'No se pudo enviar el reporte'));
    } finally {
      setEnviando(false);
    }
  };

  const responder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mensaje.trim() && !imagen) return;

    setEnviando(true);
    try {
      setHilo(await soporteService.responder(mensaje.trim(), imagen));
      setMensaje('');
      setImagen(null);
      if (inputArchivo.current) inputArchivo.current.value = '';
    } catch (error) {
      toast.error(mensajeDeError(error, 'No se pudo enviar el mensaje'));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCierre = async () => {
    setEnviando(true);
    try {
      await soporteService.marcarLeido();
      setHilo(null);
      limpiarFormulario();
      await refrescarResumen();
    } catch (error) {
      toast.error(mensajeDeError(error, 'No se pudo cerrar la conversación'));
    } finally {
      setEnviando(false);
    }
  };

  const sinLeer = resumen?.noLeidos ?? 0;
  const hiloCerrado = hilo?.estado === 'cerrado';

  return (
    <>
      {abierto && (
        <section
          role="dialog"
          aria-label="Soporte"
          className="fixed bottom-24 right-4 z-[1000] flex h-[min(32rem,calc(100dvh-9rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25 dark:border-white/10 dark:bg-slate-900 sm:right-6"
        >
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-[linear-gradient(135deg,#020617,#0f172a)] px-4 py-3.5 text-white dark:border-white/10">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-base font-black">
                <LifeBuoy className="h-5 w-5 text-cyan-300" />
                Soporte
              </h2>
              <p className="mt-0.5 truncate text-xs text-cyan-100">
                {hilo
                  ? hilo.asunto
                  : 'Contanos qué encontraste y lo revisamos.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="shrink-0 rounded-xl border border-white/10 bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Cerrar soporte"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {cargando && !hilo ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : hilo ? (
            <>
              <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-950/40">
                <ConversacionSoporte
                  mensajes={hilo.mensajes}
                  ladoAdmin={false}
                />
              </div>

              {hiloCerrado ? (
                <div className="border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                  <div className="mb-3 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      El equipo dio por resuelto este reporte. Si vuelve a
                      pasarte, abrí uno nuevo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={confirmarCierre}
                    disabled={enviando}
                    className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    {enviando ? 'Cerrando...' : 'Entendido'}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={responder}
                  className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900"
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
                      placeholder="Escribí un mensaje..."
                      className="min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => inputArchivo.current?.click()}
                      className="rounded-2xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-cyan-600 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                      title="Adjuntar captura"
                      aria-label="Adjuntar captura"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={enviando || (!mensaje.trim() && !imagen)}
                      className="rounded-2xl bg-cyan-500 p-2.5 text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-950"
                      aria-label="Enviar mensaje"
                    >
                      {enviando ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <form
              onSubmit={crearReporte}
              className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950/40"
            >
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  ¿De qué se trata?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIAS_SOPORTE.map(opcion => (
                    <button
                      key={opcion.valor}
                      type="button"
                      onClick={() => setCategoria(opcion.valor)}
                      aria-pressed={categoria === opcion.valor}
                      className={`rounded-2xl border px-3 py-2.5 text-left text-xs font-bold transition ${
                        categoria === opcion.valor
                          ? 'border-cyan-400 bg-cyan-50 text-cyan-900 dark:border-cyan-300/40 dark:bg-cyan-400/10 dark:text-cyan-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      <span className="mr-1">{opcion.emoji}</span>
                      {opcion.etiqueta}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={asunto}
                onChange={event => setAsunto(event.target.value)}
                maxLength={140}
                placeholder="Resumilo en una línea"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />

              <textarea
                value={mensaje}
                onChange={event => setMensaje(event.target.value)}
                rows={5}
                maxLength={4000}
                placeholder="Contanos qué pasó, en qué pantalla y qué esperabas que pasara."
                className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputArchivo.current?.click()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                >
                  <ImagePlus className="h-4 w-4" />
                  {imagen ? 'Cambiar captura' : 'Adjuntar captura'}
                </button>
                {imagen && (
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
                    {imagen.name}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950"
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {enviando ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </form>
          )}

          <input
            ref={inputArchivo}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={elegirImagen}
            className="hidden"
          />
        </section>
      )}

      <button
        type="button"
        onClick={() => setAbierto(prev => !prev)}
        aria-label={abierto ? 'Cerrar soporte' : 'Abrir soporte'}
        className="fixed bottom-5 right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl shadow-slate-950/30 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-300/40 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 sm:right-6"
      >
        {abierto ? <X className="h-6 w-6" /> : <LifeBuoy className="h-6 w-6" />}
        {!abierto && sinLeer > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.7rem] font-black text-white ring-2 ring-white dark:ring-slate-950">
            {sinLeer}
          </span>
        )}
      </button>
    </>
  );
};
