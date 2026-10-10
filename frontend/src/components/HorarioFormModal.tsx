import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../shared/design-system/components/Button';
import {
  horarioService,
  CreateHorarioDto,
  UpdateHorarioDto,
  Horario,
  TipoHorario,
} from '../services';
import { useToast } from '../hooks';
import { Clock } from 'lucide-react';

export interface HorarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  horario?: Horario | null;
  semanaId: number;
}

/**
 * Modal para crear o editar un horario
 */
export const HorarioFormModal: React.FC<HorarioFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  horario,
  semanaId,
}) => {
  const toast = useToast();
  const isEditing = !!horario;

  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: TipoHorario.PRESENCIAL,
    detalle: '',
    url: '',
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del horario si estamos editando
  useEffect(() => {
    if (horario && isOpen) {
      setFormData({
        titulo: horario.titulo,
        tipo: horario.tipo,
        detalle: horario.detalle,
        url: horario.url || '',
      });
    } else if (!horario && isOpen) {
      setFormData({
        titulo: '',
        tipo: TipoHorario.PRESENCIAL,
        detalle: '',
        url: '',
      });
    }
    setErrors({});
  }, [horario, isOpen]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    if (!formData.detalle.trim()) {
      newErrors.detalle = 'El detalle del horario es obligatorio';
    }

    if (formData.tipo === TipoHorario.VIRTUAL && !formData.url.trim()) {
      newErrors.url = 'La URL es obligatoria para clases virtuales';
    }

    if (formData.url.trim() && !isValidUrl(formData.url)) {
      newErrors.url = 'Ingresa una URL válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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
      if (isEditing && horario) {
        const updateData: UpdateHorarioDto = {
          titulo: formData.titulo,
          tipo: formData.tipo,
          detalle: formData.detalle,
          // null y no undefined: axios descarta las claves undefined, y sin
          // el campo el backend conserva el enlace anterior.
          url: formData.url.trim() || null,
        };
        await horarioService.update(horario.id, updateData);
        toast.success('Horario actualizado exitosamente');
      } else {
        const createData: CreateHorarioDto = {
          titulo: formData.titulo,
          tipo: formData.tipo,
          detalle: formData.detalle,
          url: formData.url || undefined,
          semanaId,
        };
        await horarioService.create(createData);
        toast.success('Horario creado exitosamente');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar horario:', error);
      toast.error(
        error.response?.data?.message || 'Error al guardar el horario'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay con blur */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-md transition-opacity dark:bg-slate-900/55"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-5xl transform transition-all">
          <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 dark:border-slate-600 dark:bg-slate-900 dark:shadow-slate-950/35 sm:max-h-[90dvh]">
            {/* Header Premium */}
            <div className="relative flex-shrink-0 overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#dbeafe_52%,#bfdbfe_100%)] p-4 sm:p-6 dark:border-slate-600 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_34%),linear-gradient(135deg,#1e293b_0%,#1d4ed8_52%,#0f766e_100%)]">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex min-w-0 items-center gap-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                  <Clock className="h-6 w-6 text-blue-500 dark:text-white" />
                  {isEditing ? 'Editar Horario' : 'Crear Nuevo Horario'}
                </h2>
                <button
                  onClick={onClose}
                  className="relative rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition-all hover:bg-white hover:text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <svg
                    className="h-6 w-6"
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
              <p className="mt-2 text-sm text-slate-600 dark:text-blue-100/90">
                {isEditing
                  ? 'Modifica los detalles del horario de clase.'
                  : 'Define un nuevo horario para las clases presenciales o virtuales.'}
              </p>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%),#f8fafc] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_30%),#111827] [scrollbar-color:#94a3b8_transparent] dark:[scrollbar-color:#64748b_transparent]"
            >
              <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                {/* Título */}
                <div>
                  <label
                    htmlFor="titulo"
                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white ${
                      errors.titulo
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-slate-600'
                    }`}
                    placeholder="Ej: Clase Teórica"
                  />
                  {errors.titulo && (
                    <p className="mt-1 text-sm text-red-500">{errors.titulo}</p>
                  )}
                </div>

                {/* Tipo de Clase */}
                <div>
                  <label
                    htmlFor="tipo"
                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Tipo de Clase <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          tipo: TipoHorario.PRESENCIAL,
                        }))
                      }
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.tipo === TipoHorario.PRESENCIAL
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-slate-300'
                      }`}
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="font-medium">Presencial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          tipo: TipoHorario.VIRTUAL,
                        }))
                      }
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.tipo === TipoHorario.VIRTUAL
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-slate-300'
                      }`}
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
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">Virtual</span>
                    </button>
                  </div>
                </div>

                {/* Detalle */}
                <div>
                  <label
                    htmlFor="detalle"
                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Detalle del Horario <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="detalle"
                    name="detalle"
                    value={formData.detalle}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white resize-none ${
                      errors.detalle
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-slate-600'
                    }`}
                    placeholder="Ej: Lunes 18:00 a 20:00 - Aula 305"
                  />
                  {errors.detalle && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.detalle}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-300 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
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
                    Incluye día, horario y ubicación (aula o enlace)
                  </p>
                </div>

                {/* URL (para clases virtuales) */}
                <div>
                  <label
                    htmlFor="url"
                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                  >
                    URL{' '}
                    {formData.tipo === TipoHorario.VIRTUAL && (
                      <span className="text-red-500">*</span>
                    )}
                    {formData.tipo === TipoHorario.PRESENCIAL && (
                      <span className="text-gray-400 font-normal">
                        (Opcional)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                    <input
                      type="url"
                      id="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white ${
                        errors.url
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                          : 'border-gray-200 dark:border-slate-600'
                      }`}
                      placeholder="https://meet.google.com/abc-defg-hij"
                    />
                  </div>
                  {errors.url && (
                    <p className="mt-1 text-sm text-red-500">{errors.url}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
                    {formData.tipo === TipoHorario.VIRTUAL
                      ? 'Enlace de Google Meet, Zoom u otra plataforma'
                      : 'Enlace opcional para material adicional'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-600 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    type="button"
                    disabled={loading}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-6 py-2.5 font-semibold text-slate-700 transition-all hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl border-none bg-emerald-400 px-6 py-2.5 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300 sm:w-auto"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin text-slate-950"
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
                    ) : isEditing ? (
                      'Actualizar Horario'
                    ) : (
                      'Crear Horario'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default HorarioFormModal;
