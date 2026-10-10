import React, { useState, useEffect } from 'react';
import { Button } from '../shared/design-system/components/Button';
import { comisionService, Comision } from '../services';
import { useToast } from '../hooks';
import { useSolicitudInscripcion } from '../hooks/useInscripcion';

export interface InscripcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materiaId: number;
  materiaNombre: string;
  cursadaId: number;
}

/**
 * Modal para solicitar inscripción a una materia
 * El alumno selecciona una comisión y solicita unirse
 */
export const InscripcionModal: React.FC<InscripcionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  materiaId,
  materiaNombre,
}) => {
  const toast = useToast();
  const { solicitarInscripcion, loading, error } = useSolicitudInscripcion();

  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loadingComisiones, setLoadingComisiones] = useState(false);
  const [errorComisiones, setErrorComisiones] = useState<string | null>(null);
  const [comisionSeleccionada, setComisionSeleccionada] = useState<
    number | null
  >(null);

  // Cargar comisiones disponibles
  useEffect(() => {
    const loadComisiones = async () => {
      if (!materiaId || !isOpen) return;
      setLoadingComisiones(true);
      setErrorComisiones(null);
      setComisiones([]);
      try {
        const data =
          await comisionService.getByMateriaForInscripcion(materiaId);
        setComisiones(data);
      } catch (error: any) {
        console.error('Error al cargar comisiones:', error);
        const status = error.response?.status;
        const message =
          status === 401
            ? 'Tu sesión venció. Volvé a iniciar sesión.'
            : status === 403
              ? 'No tenés permiso para consultar las comisiones.'
              : 'No se pudieron cargar las comisiones. Intentá nuevamente.';
        setErrorComisiones(message);
        toast.error(message);
      } finally {
        setLoadingComisiones(false);
      }
    };
    loadComisiones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId, isOpen]);

  // Resetear selección al abrir
  useEffect(() => {
    if (isOpen) {
      setComisionSeleccionada(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comisionSeleccionada) {
      toast.error('Por favor, selecciona una comisión');
      return;
    }

    const result = await solicitarInscripcion(materiaId, comisionSeleccionada);

    if (result) {
      toast.success(
        'Solicitud enviada exitosamente. Esperando aprobación del profesor.'
      );
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay con blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-3xl transform transition-all">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="enrollment-modal-title"
            className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:max-h-[90dvh]"
          >
            {/* Header Premium */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6">
              <div className="flex items-center justify-between">
                <h2
                  id="enrollment-modal-title"
                  className="flex items-center gap-2 text-xl font-black text-white sm:text-2xl"
                >
                  <svg
                    className="w-6 h-6 text-green-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Solicitar Inscripción
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                  aria-label="Cerrar"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-green-100 mt-2 text-sm">
                Selecciona la comisión a la que deseas unirte en{' '}
                <strong>{materiaNombre}</strong>
              </p>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleSubmit}
              className="min-h-0 space-y-6 overflow-y-auto p-5 sm:p-6"
            >
              {/* Información */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      ¿Cómo funciona?
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Tu solicitud será enviada al profesor de la materia. Una
                      vez aprobada, podrás acceder a todo el contenido de la
                      materia.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selección de Comisión */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                  Selecciona tu Comisión <span className="text-red-500">*</span>
                </label>
                {loadingComisiones ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="animate-pulse h-20 bg-gray-100 dark:bg-slate-800 rounded-xl"
                      ></div>
                    ))}
                  </div>
                ) : errorComisiones ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                  >
                    {errorComisiones}
                  </div>
                ) : comisiones.length > 0 ? (
                  <div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1">
                    {comisiones.map(comision => (
                      <label
                        key={comision.id}
                        className={`flex items-start space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                          comisionSeleccionada === comision.id
                            ? 'bg-green-50 border-green-500 dark:bg-green-900/20 dark:border-green-600 shadow-md'
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
                            comisionSeleccionada === comision.id
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 dark:border-gray-500'
                          }`}
                        >
                          {comisionSeleccionada === comision.id && (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <input
                          type="radio"
                          name="comision"
                          value={comision.id}
                          checked={comisionSeleccionada === comision.id}
                          onChange={() => setComisionSeleccionada(comision.id)}
                          className="hidden"
                        />
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {comision.nombre}
                          </p>
                          {comision.descripcion && (
                            <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                              {comision.descripcion}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-slate-300 p-6 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900/50 text-center">
                    No hay comisiones disponibles para esta materia.
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                  type="button"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={
                    loading || !comisionSeleccionada || comisiones.length === 0
                  }
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                      Enviando...
                    </div>
                  ) : (
                    'Enviar Solicitud'
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InscripcionModal;
