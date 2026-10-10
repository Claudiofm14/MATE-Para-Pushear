import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/design-system/components/Modal';
import { LoadingSpinner } from './LoadingSpinner';
import { usuarioService } from '../services/usuario.service';
import { useToast } from '../hooks';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { AsignarProfesorModal } from './AsignarProfesorModal';

interface GestionarProfesoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  materiaId: number;
  materiaNombre: string;
}

interface ProfesorMateria {
  id: number;
  profesor: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    authProviderId: string;
  };
}

export const GestionarProfesoresModal: React.FC<
  GestionarProfesoresModalProps
> = ({ isOpen, onClose, materiaId, materiaNombre }) => {
  const [profesores, setProfesores] = useState<ProfesorMateria[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<ProfesorMateria | null>(null);
  const toast = useToast();

  const loadProfesores = async () => {
    setLoading(true);
    try {
      const data = await usuarioService.obtenerProfesoresMateria(materiaId);
      setProfesores(data || []);
    } catch (error: any) {
      console.error('Error al cargar profesores:', error);
      toast.error(
        error.response?.data?.message ||
          'Error al cargar la lista de profesores'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && materiaId) {
      loadProfesores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, materiaId]);

  const handleDelete = async (asignacionId: number) => {
    if (
      !window.confirm(
        'Estas seguro de dar de baja a este profesor de la materia?'
      )
    ) {
      return;
    }

    try {
      await usuarioService.removerAsignacionProfesor(asignacionId);
      toast.success('Profesor dado de baja exitosamente');
      setProfesores(prev => prev.filter(p => p.id !== asignacionId));
    } catch (error: any) {
      console.error('Error al eliminar asignacion:', error);
      toast.error(
        error.response?.data?.message || 'Error al dar de baja al profesor'
      );
    }
  };

  const handleEdit = (assignment: ProfesorMateria) => {
    setEditingAssignment(assignment);
    setIsAssignModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAssignment(null);
    setIsAssignModalOpen(true);
  };

  const handleAssignModalClose = () => {
    setIsAssignModalOpen(false);
    setEditingAssignment(null);
    loadProfesores();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Profesores de ${materiaNombre}`}
        size="lg"
      >
        <div className="mb-5 flex justify-stretch sm:justify-end">
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-200 sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            Asignar Profesor
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : profesores.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 py-10 text-center font-medium text-slate-500 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-400">
            No hay profesores asignados a esta materia.
          </div>
        ) : (
          <div className="space-y-4">
            {profesores.map(p => (
              <div
                key={p.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    {p.profesor?.nombre || 'Sin nombre'}{' '}
                    {p.profesor?.apellido || ''}
                  </h3>
                  <p className="mb-3 break-all text-sm font-medium text-slate-500 dark:text-slate-300 sm:break-normal">
                    {p.profesor?.email || 'Sin email'}
                  </p>
                  <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-100">
                    Acceso completo a la materia
                  </span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-cyan-700 transition-all hover:-translate-y-0.5 hover:bg-cyan-300/15 dark:text-cyan-100 sm:flex-none"
                    aria-label="Editar asignación"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-white shadow-lg shadow-red-950/20 transition-all hover:-translate-y-0.5 hover:bg-red-500 sm:flex-none"
                    aria-label="Eliminar asignación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <AsignarProfesorModal
        isOpen={isAssignModalOpen}
        onClose={handleAssignModalClose}
        materiaId={materiaId}
        materiaNombre={materiaNombre}
        initialProfesorAuthProviderId={
          editingAssignment?.profesor?.authProviderId
        }
        isEditing={!!editingAssignment}
      />
    </>
  );
};
