import React, { useState, useEffect } from 'react';
import {
  Archive,
  BookOpen,
  Loader2,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';

interface Materia {
  id?: number;
  codigo: string;
  nombre: string;
}

interface MateriaFormData {
  id?: number;
  codigo: string;
  nombre: string;
}

interface MateriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (materia: MateriaFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onArchive?: (id: number) => Promise<void>;
  materia?: Materia | null;
  mode: 'create' | 'edit';
}

/**
 * Modal para crear o editar materias
 * Solo disponible para usuarios con rol de docente
 */
export const MateriaModal: React.FC<MateriaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onArchive,
  materia,
  mode,
}) => {
  const [formData, setFormData] = useState<MateriaFormData>({
    codigo: '',
    nombre: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    if (materia && mode === 'edit') {
      setFormData({
        id: materia.id,
        codigo: materia.codigo,
        nombre: materia.nombre,
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
      });
    }
    setShowDeleteConfirm(false);
    setShowArchiveConfirm(false);
  }, [materia, mode, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'anio' || name === 'cuatrimestre'
          ? value
            ? parseInt(value)
            : undefined
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        id: formData.id,
        codigo: formData.codigo,
        nombre: formData.nombre,
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar materia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete && materia?.id) {
      setLoading(true);
      try {
        await onDelete(materia.id);
        onClose();
      } catch (error) {
        console.error('Error al eliminar materia:', error);
      } finally {
        setLoading(false);
        setShowDeleteConfirm(false);
      }
    }
  };

  const handleArchive = async () => {
    if (onArchive && materia?.id) {
      setLoading(true);
      try {
        await onArchive(materia.id);
        onClose();
      } catch (error) {
        console.error('Error al archivar materia:', error);
      } finally {
        setLoading(false);
        setShowArchiveConfirm(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay con blur */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="flex min-h-full items-start justify-center p-3 py-6 sm:items-center sm:p-4">
        <div className="relative w-full max-w-2xl transform transition-all">
          <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/25 dark:border-white/10 dark:bg-slate-950 sm:max-h-[90dvh]">
            {/* Header Premium */}
            <div className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)] p-4 text-white dark:border-white/10 sm:p-6">
              <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(125,211,252,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,.06)_1px,transparent_1px)] [background-size:34px_34px]" />
              <div className="relative flex items-start justify-between gap-3">
                <h2 className="flex min-w-0 items-center gap-2 text-xl font-black leading-tight text-white sm:text-2xl">
                  <BookOpen className="h-6 w-6 text-cyan-200" />
                  {mode === 'create' ? 'Nueva Materia' : 'Editar Materia'}
                </h2>
                <button
                  onClick={onClose}
                  className="shrink-0 rounded-2xl border border-white/10 bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="relative mt-2 text-sm font-medium leading-6 text-cyan-100">
                {mode === 'create'
                  ? 'Registra una nueva materia en el sistema.'
                  : 'Actualiza la información de la materia existente.'}
              </p>
            </div>

            {/* Confirmación de archivado */}
            {showArchiveConfirm ? (
              <div className="overflow-y-auto bg-slate-50 p-5 dark:bg-slate-950 sm:p-8">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 text-amber-600 shadow-lg shadow-amber-950/10 dark:border-amber-300/20 dark:bg-amber-500/10 dark:text-amber-200">
                    <Archive className="h-10 w-10" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                    ¿Archivar materia?
                  </h3>
                  <p className="mx-auto max-w-md text-gray-600 dark:text-slate-300">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      "{materia?.nombre}"
                    </span>{' '}
                    va a dejar de estar visible para alumnos y docentes, pero se
                    conserva <strong>todo su contenido</strong>: cursadas,
                    semanas, videos, ejercicios, entregas y materiales.
                  </p>
                  <p className="mx-auto mt-3 max-w-md text-sm text-gray-500 dark:text-slate-400">
                    Podés desarchivarla cuando quieras y vuelve a quedar tal
                    como estaba.
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={() => setShowArchiveConfirm(false)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleArchive}
                    disabled={loading}
                    className="w-full rounded-2xl bg-amber-500 px-6 py-3 font-bold text-white shadow-lg shadow-amber-950/20 transition-all hover:-translate-y-0.5 hover:bg-amber-400 disabled:opacity-50 sm:w-auto"
                  >
                    {loading ? 'Archivando...' : 'Sí, Archivar'}
                  </button>
                </div>
              </div>
            ) : /* Confirmación de eliminación */
            showDeleteConfirm ? (
              <div className="overflow-y-auto bg-slate-50 p-5 dark:bg-slate-950 sm:p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-red-200 bg-red-50 text-red-600 shadow-lg shadow-red-950/10 dark:border-red-300/20 dark:bg-red-500/10 dark:text-red-200">
                    <TriangleAlert className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    ¿Eliminar materia?
                  </h3>
                  <p className="text-gray-600 dark:text-slate-300 max-w-md mx-auto">
                    Esta acción no se puede deshacer. ¿Estás seguro de que
                    deseas eliminar la materia{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      "{materia?.nombre}"
                    </span>
                    ?
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full rounded-2xl bg-red-600 px-6 py-3 font-bold text-white shadow-lg shadow-red-950/20 transition-all hover:-translate-y-0.5 hover:bg-red-500 disabled:opacity-50 sm:w-auto"
                  >
                    {loading ? 'Eliminando...' : 'Sí, Eliminar'}
                  </button>
                </div>
              </div>
            ) : (
              /* Formulario */
              <form
                onSubmit={handleSubmit}
                className="min-h-0 space-y-6 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950 sm:p-6"
              >
                {/* Código */}
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]">
                  <label
                    htmlFor="codigo"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Código de Materia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="codigo"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleChange}
                    required
                    placeholder="ej: MAT101"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 dark:border-white/10 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
                    Identificador único de la materia (ej. MAT-101)
                  </p>
                </div>

                {/* Nombre */}
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]">
                  <label
                    htmlFor="nombre"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Nombre de Materia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="ej: Matemática I"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 dark:border-white/10 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                {/* Botones */}
                <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <div className="order-2 flex flex-col gap-3 sm:order-1 sm:flex-row">
                    {mode === 'edit' && onArchive && (
                      <button
                        type="button"
                        onClick={() => setShowArchiveConfirm(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 font-bold text-amber-700 transition-all hover:bg-amber-100 dark:border-amber-300/20 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15 sm:w-auto"
                        title="Conserva el contenido y la saca de circulación"
                      >
                        <Archive className="h-4 w-4" />
                        Archivar
                      </button>
                    )}
                    {mode === 'edit' && onDelete && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 font-bold text-red-700 transition-all hover:bg-red-100 dark:border-red-300/20 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15 sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="order-1 flex flex-col-reverse gap-3 sm:order-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 font-black text-slate-950 shadow-lg shadow-cyan-950/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : mode === 'create' ? (
                        'Crear Materia'
                      ) : (
                        'Guardar Cambios'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
