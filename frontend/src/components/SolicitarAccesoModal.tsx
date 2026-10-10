import React, { useState } from 'react';
import { X, AlertCircle, BookOpen } from 'lucide-react';
import { usuarioService } from '../services/usuario.service';
import { useToast } from '../hooks';
import { Button } from '../shared/design-system/components/Button';

interface SolicitarAccesoModalProps {
  isOpen: boolean;
  onClose: () => void;
  materiaId: number;
}

export const SolicitarAccesoModal: React.FC<SolicitarAccesoModalProps> = ({
  isOpen,
  onClose,
  materiaId,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await usuarioService.solicitarAccesoMateria({
        materiaId,
      });
      toast.success('Solicitud enviada exitosamente');
      onClose();
    } catch (error: any) {
      console.error('Error al enviar solicitud:', error);
      toast.error(
        error.response?.data?.message || 'Error al enviar la solicitud'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-md sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-modal-title"
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-white/10 sm:p-6">
          <h2
            id="access-modal-title"
            className="text-xl font-black text-slate-950 dark:text-white"
          >
            Solicitar Acceso
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="app-icon-button"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-300/20 dark:bg-blue-300/10">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              No tienes acceso a esta materia. La solicitud se enviara para
              obtener acceso docente completo a la materia.
            </p>
          </div>

          <div className="flex gap-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-300">
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <p>No hace falta seleccionar comisiones.</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 dark:border-white/10 sm:flex-row sm:justify-end sm:p-6">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            loading={submitting}
          >
            Enviar Solicitud
          </Button>
        </div>
      </section>
    </div>
  );
};
