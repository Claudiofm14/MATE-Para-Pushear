import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlayCircle, Save, Sparkles, X } from 'lucide-react';
import { Button } from '../shared/design-system/components/Button';
import {
  videoService,
  CreateVideoDto,
  UpdateVideoDto,
  Video,
} from '../services';
import { semanaService, Semana } from '../services/semana.service';
import { cursadaService } from '../services/cursada.service';
import { useToast } from '../hooks';
import { parseYoutubeUrl, toEmbedUrl } from '../utils/youtube';

export interface VideoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  video?: Video | null;
  semanaId?: number; // Opcional
  materiaId?: number; // Opcional, para filtrar semanas
  cursadaId?: number; // Limita el selector a la cursada de la pantalla actual
}

/**
 * Modal para crear o editar un video o playlist
 * Incluye validaciones de URL de YouTube y preview
 */
export const VideoFormModal: React.FC<VideoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  video,
  semanaId: initialSemanaId,
  materiaId,
  cursadaId,
}) => {
  const toast = useToast();
  const isEditing = !!video;
  const videoSemanaId = video?.semanaId || video?.semana?.id;
  const videoMateriaId = video?.materiaId || video?.materia?.id;
  const contextSemanaId = videoSemanaId || initialSemanaId;
  const contextMateriaId = materiaId || videoMateriaId;
  const [resolvedMateriaId, setResolvedMateriaId] = useState<number>();
  const targetMateriaId = contextMateriaId || resolvedMateriaId;

  // Estado del formulario
  const [formData, setFormData] = useState<{
    titulo: string;
    subtitulo: string;
    url: string;
    orden: number;
    semanaId?: number;
    materiaId?: number;
  }>({
    titulo: '',
    subtitulo: '',
    url: '',
    orden: 1,
    semanaId: initialSemanaId,
    materiaId: materiaId,
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [loadingSemanas, setLoadingSemanas] = useState(false);
  const [semanasError, setSemanasError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingSemanas(true);
    setSemanas([]);
    setSemanasError('');
    setResolvedMateriaId(undefined);

    const loadSemanas = async () => {
      try {
        let data: Semana[] = [];
        let materiaIdForWeeks = contextMateriaId;
        let allowedCursadaIds: number[] = [];

        if (cursadaId) {
          allowedCursadaIds = [cursadaId];
          data = await semanaService.getByCursada(cursadaId);
        } else if (contextSemanaId) {
          // Resolver la cursada desde la semana cuando el modal no recibe
          // contexto explícito. Nunca consultar el listado global.
          const semana = await semanaService.getById(contextSemanaId);
          const resolvedCursadaId = semana.cursadaId || semana.cursada?.id;
          if (
            semana.deletedAt ||
            semana.cursada?.deletedAt ||
            !resolvedCursadaId
          ) {
            throw new Error('La semana ya no está disponible.');
          }
          materiaIdForWeeks = materiaIdForWeeks || semana.cursada?.materiaId;
          allowedCursadaIds = [resolvedCursadaId];
          data = await semanaService.getByCursada(resolvedCursadaId);
        } else if (contextMateriaId) {
          const cursadas = await cursadaService.getByMateria(contextMateriaId);
          allowedCursadaIds = cursadas
            .filter(
              cursada =>
                !cursada.deletedAt && cursada.materiaId === contextMateriaId
            )
            .map(cursada => cursada.id);
          data = (
            await Promise.all(
              allowedCursadaIds.map(id => semanaService.getByCursada(id))
            )
          ).flat();
        } else {
          throw new Error('Falta la materia o cursada del video.');
        }

        const validWeeks = data
          .filter(
            semana =>
              !semana.deletedAt &&
              !semana.cursada?.deletedAt &&
              allowedCursadaIds.includes(
                semana.cursadaId || semana.cursada?.id || 0
              ) &&
              (!materiaIdForWeeks ||
                !semana.cursada?.materiaId ||
                semana.cursada.materiaId === materiaIdForWeeks)
          )
          .sort((first, second) => first.numeroSemana - second.numeroSemana);
        materiaIdForWeeks =
          materiaIdForWeeks || validWeeks[0]?.cursada?.materiaId;

        if (!cancelled) {
          setSemanas(validWeeks);
          setResolvedMateriaId(materiaIdForWeeks);
        }
      } catch {
        if (!cancelled) {
          setSemanasError(
            'No se pudieron cargar las semanas de esta materia o cursada. Volvé a abrir el formulario para reintentar.'
          );
        }
      } finally {
        if (!cancelled) setLoadingSemanas(false);
      }
    };

    loadSemanas();
    return () => {
      cancelled = true;
    };
  }, [isOpen, cursadaId, contextSemanaId, contextMateriaId]);

  // Cargar datos del video si estamos editando
  useEffect(() => {
    if (video) {
      setFormData({
        titulo: video.titulo,
        subtitulo: video.subtitulo || '',
        url: video.url,
        orden: video.orden || 1,
        semanaId:
          videoSemanaId || (videoMateriaId ? undefined : initialSemanaId),
        materiaId: videoMateriaId || materiaId,
      });
    } else {
      setFormData({
        titulo: '',
        subtitulo: '',
        url: '',
        orden: 1,
        semanaId: initialSemanaId,
        materiaId: materiaId,
      });
    }
    setErrors({});
  }, [
    video,
    isOpen,
    initialSemanaId,
    materiaId,
    videoSemanaId,
    videoMateriaId,
  ]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'semanaId') {
      const val = parseInt(value);
      setFormData(prev => ({
        ...prev,
        semanaId: val === 0 ? undefined : val,
        // Si selecciona una semana, limpiamos materiaId (opcional, o lo mantenemos)
        // Si selecciona 0 (General), nos aseguramos de tener materiaId si estamos en contexto de materia
        materiaId: val === 0 ? targetMateriaId : undefined,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'orden' ? parseInt(value) || 0 : value,
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validar formulario
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'La URL es obligatoria';
    } else if (!toEmbedUrl(formData.url)) {
      newErrors.url =
        'Ingresá una URL válida de un video o playlist de YouTube';
    }

    if (formData.orden < 1) {
      newErrors.orden = 'El orden debe ser mayor a 0';
    }

    if (loadingSemanas) {
      newErrors.semanaId = 'Esperá a que se carguen las semanas.';
    } else if (semanasError) {
      newErrors.semanaId = semanasError;
    } else if (
      formData.semanaId &&
      !semanas.some(semana => semana.id === formData.semanaId)
    ) {
      newErrors.semanaId = 'Seleccioná una semana disponible de esta cursada.';
    } else if (!formData.semanaId && !targetMateriaId) {
      newErrors.semanaId = 'Debes seleccionar una semana para este video.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor, corrige los errores del formulario');
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        url: parseYoutubeUrl(formData.url)?.href ?? formData.url.trim(),
        materiaId: formData.semanaId ? undefined : targetMateriaId,
      };

      if (isEditing && video) {
        await videoService.update(video.id, dataToSend as UpdateVideoDto);
        toast.success('Video o playlist actualizado exitosamente');
      } else {
        await videoService.create(dataToSend as CreateVideoDto);
        toast.success('Video o playlist creado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar video:', error);
      const errorMessage =
        error.response?.data?.message || 'Error al guardar el video o playlist';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const youtubeEmbedUrl = toEmbedUrl(formData.url);
  const selectedSemanaUnavailable =
    !!formData.semanaId &&
    !semanas.some(semana => semana.id === formData.semanaId);

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-md transition-opacity dark:bg-slate-900/55"
        onClick={onClose}
      ></div>

      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-5xl transform transition-all">
          <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/35 sm:max-h-[90dvh]">
            <div className="relative flex-shrink-0 overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.24),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#e0f2fe_52%,#d1fae5_100%)] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.20),transparent_34%),linear-gradient(135deg,#1e293b_0%,#2563eb_52%,#0f766e_100%)] p-5 sm:p-7">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="flex items-start justify-between gap-3">
                <div className="relative flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-950/25">
                    <PlayCircle className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-200/30 dark:bg-slate-700 dark:text-emerald-50">
                      <Sparkles className="h-3.5 w-3.5" />
                      Biblioteca audiovisual
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                      {isEditing
                        ? 'Editar video o playlist'
                        : 'Nuevo video o playlist'}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-200 sm:text-base">
                      {isEditing
                        ? 'Modifica los detalles del video o playlist existente.'
                        : 'Agrega un video o playlist de YouTube a la materia o semana.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="relative rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition-all hover:bg-white hover:text-slate-950 dark:border-white/20 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-white/25 dark:hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%),#f8fafc] p-4 [scrollbar-color:#94a3b8_transparent] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_32%),#111827] dark:[scrollbar-color:#94a3b8_transparent] sm:space-y-6 sm:p-6"
            >
              {/* Semana Selector */}
              <div>
                <label
                  htmlFor="semanaId"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  Ubicación del video o playlist
                </label>
                {loadingSemanas ? (
                  <div className="h-12 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
                ) : (
                  <div className="relative">
                    <select
                      id="semanaId"
                      name="semanaId"
                      value={formData.semanaId || 0}
                      onChange={handleChange}
                      className={`w-full appearance-none rounded-2xl border bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all dark:bg-slate-800 dark:text-slate-50 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 ${
                        errors.semanaId
                          ? 'border-red-400 bg-red-500/10'
                          : 'border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <option value={0} disabled={!targetMateriaId}>
                        {targetMateriaId
                          ? '📚 General (Sin semana específica)'
                          : '-- Selecciona una semana o General --'}
                      </option>
                      {selectedSemanaUnavailable && (
                        <option value={formData.semanaId} disabled>
                          Semana no disponible (elegí otra ubicación)
                        </option>
                      )}
                      {semanas.map(semana => (
                        <option key={semana.id} value={semana.id}>
                          📅 {semana.titulo} (Semana {semana.numeroSemana})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-300">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
                {(errors.semanaId || semanasError) && (
                  <p
                    role="alert"
                    className="mt-1 text-sm text-red-500 flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {errors.semanaId || semanasError}
                  </p>
                )}
                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-300">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {targetMateriaId
                    ? 'Selecciona "General" para videos de la materia no asociados a una semana.'
                    : 'Si seleccionas "General", el video aparecerá en la sección principal.'}
                </p>
              </div>

              {/* Título */}
              <div>
                <label
                  htmlFor="titulo"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  Título del video o playlist{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-500 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 ${
                    errors.titulo
                      ? 'border-red-400 bg-red-500/10'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                  placeholder="Ej: Introducción a Spring Boot"
                />
                {errors.titulo && (
                  <p className="mt-1 text-sm text-red-500">{errors.titulo}</p>
                )}
              </div>

              {/* Subtítulo */}
              <div>
                <label
                  htmlFor="subtitulo"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  Subtítulo{' '}
                  <span className="font-normal text-slate-500 dark:text-slate-300">
                    (Opcional)
                  </span>
                </label>
                <input
                  type="text"
                  id="subtitulo"
                  name="subtitulo"
                  value={formData.subtitulo}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                  placeholder="Breve descripción del contenido"
                />
              </div>

              {/* URL */}
              <div>
                <label
                  htmlFor="url"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  URL de YouTube (video o playlist){' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-red-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border bg-white py-3 pl-10 pr-4 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 ${
                      errors.url
                        ? 'border-red-400 bg-red-500/10'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                    placeholder="https://www.youtube.com/watch?v=... o https://www.youtube.com/playlist?list=..."
                  />
                </div>
                {errors.url && (
                  <p className="mt-1 text-sm text-red-500">{errors.url}</p>
                )}
              </div>

              {/* Preview del video o playlist */}
              {youtubeEmbedUrl && (
                <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-sm ring-1 ring-white/10">
                  <div className="aspect-video w-full">
                    <iframe
                      src={youtubeEmbedUrl}
                      title="Vista previa del video o playlist"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              {/* Orden */}
              <div>
                <label
                  htmlFor="orden"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  Orden de Aparición
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <input
                    type="number"
                    id="orden"
                    name="orden"
                    value={formData.orden}
                    onChange={handleChange}
                    min="1"
                    className="w-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
                  />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
                    Define la posición del video o playlist en la lista.
                  </span>
                </div>
                {errors.orden && (
                  <p className="mt-1 text-sm text-red-500">{errors.orden}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-700 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                  type="button"
                  disabled={loading}
                  className="w-full rounded-2xl border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading || loadingSemanas || !!semanasError}
                  className="w-full rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-300 sm:w-auto"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Guardando...
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {isEditing
                        ? 'Actualizar video o playlist'
                        : 'Crear video o playlist'}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default VideoFormModal;
