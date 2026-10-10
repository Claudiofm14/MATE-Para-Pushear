import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';

interface ComentarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comentario: string) => void;
  comentario: string;
  alumnoNombre: string;
  actividadNombre: string;
  readOnly?: boolean;
}

export const ComentarioModal: React.FC<ComentarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  comentario: comentarioInicial,
  alumnoNombre,
  actividadNombre,
  readOnly = false,
}) => {
  const [comentario, setComentario] = useState(comentarioInicial);
  const placeholder = [
    'Escribe aqui tu devolucion al alumno...',
    '',
    'Puedes incluir:',
    '- Comentarios generales',
    '- Fragmentos de codigo',
    '- Sugerencias de mejora',
    '- Errores encontrados',
  ].join('\n');

  const handleSave = () => {
    if (!readOnly) {
      onSave(comentario);
    }
    onClose();
  };

  const handleClose = () => {
    if (!readOnly) {
      setComentario(comentarioInicial);
    }
    onClose();
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-900 sm:max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 dark:border-slate-700 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-xl font-black text-gray-900 dark:text-white sm:text-2xl">
              {readOnly ? 'Ver Comentario' : 'Comentario'} - {actividadNombre}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
              Alumno: {alumnoNombre}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Comentario / Devolución
              </label>
              <textarea
                value={comentario}
                onChange={e => !readOnly && setComentario(e.target.value)}
                disabled={readOnly}
                className="min-h-[260px] w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm leading-6 text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                rows={10}
                placeholder={readOnly ? 'No hay comentarios' : placeholder}
              />
              {!readOnly && (
                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500 dark:text-slate-300">
                    {comentario.length} caracteres
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-300">
                    Usa Enter para saltos de línea
                  </p>
                </div>
              )}
            </div>

            {/* Preview */}
            {!readOnly && comentario && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Vista Previa
                </label>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                    {comentario}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 p-4 dark:border-slate-700 sm:flex-row sm:p-6">
          {readOnly ? (
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-sm"
            >
              Cerrar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-sm"
              >
                <Save className="w-5 h-5" />
                Guardar Comentario
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
