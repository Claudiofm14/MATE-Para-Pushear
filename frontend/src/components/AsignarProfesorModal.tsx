import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/design-system/components/Modal';
import { Button } from '../shared/design-system/components/Button';
import { LoadingSpinner } from './LoadingSpinner';
import { apiService } from '../shared/services/api.service';
import { useToast } from '../hooks';
import { BookOpen, Check, Search } from 'lucide-react';

interface AsignarProfesorModalProps {
  isOpen: boolean;
  onClose: () => void;
  materiaId: number;
  materiaNombre: string;
  initialProfesorAuthProviderId?: string;
  isEditing?: boolean;
}

interface Profesor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  authProviderId: string;
  rol: string;
}

export const AsignarProfesorModal: React.FC<AsignarProfesorModalProps> = ({
  isOpen,
  onClose,
  materiaId,
  materiaNombre,
  initialProfesorAuthProviderId,
  isEditing,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [selectedProfesor, setSelectedProfesor] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const usersResponse: any = await apiService.get('/api/admin/usuarios');
      setProfesores(usersResponse || []);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && materiaId) {
      loadData();
      if (initialProfesorAuthProviderId) {
        setSelectedProfesor(initialProfesorAuthProviderId);
      }
    } else {
      setSelectedProfesor('');
      setSearchTerm('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, materiaId, initialProfesorAuthProviderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfesor) {
      toast.error('Debes seleccionar un usuario');
      return;
    }

    setLoading(true);
    try {
      await apiService.post('/api/admin/asignar-profesor', {
        profesorAuthProviderId: selectedProfesor,
        materiaId,
      });
      toast.success(
        isEditing
          ? 'Asignacion actualizada exitosamente'
          : 'Profesor asignado exitosamente'
      );
      onClose();
    } catch (error: any) {
      console.error('Error al asignar profesor:', error);
      toast.error(error.response?.data?.message || 'Error al asignar profesor');
    } finally {
      setLoading(false);
    }
  };

  const filteredProfesores = profesores.filter(
    p =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEditing ? 'Editar Asignacion' : 'Asignar Profesor'} a ${materiaNombre}`}
      size="lg"
    >
      {loading && profesores.length === 0 ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {isEditing ? 'Usuario (No editable)' : 'Seleccionar Usuario'}
            </label>
            {isEditing ? (
              <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200">
                {
                  profesores.find(p => p.authProviderId === selectedProfesor)
                    ?.nombre
                }{' '}
                {
                  profesores.find(p => p.authProviderId === selectedProfesor)
                    ?.apellido
                }
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                  {filteredProfesores.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No se encontraron usuarios
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredProfesores.map(profesor => (
                        <div
                          key={profesor.id}
                          onClick={() =>
                            setSelectedProfesor(profesor.authProviderId)
                          }
                          className={`flex cursor-pointer items-start justify-between gap-3 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                            selectedProfesor === profesor.authProviderId
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {profesor.nombre} {profesor.apellido}
                            </p>
                            <p className="break-all text-sm text-gray-500 dark:text-slate-300 sm:break-normal">
                              {profesor.email} - {profesor.rol}
                            </p>
                          </div>
                          {selectedProfesor === profesor.authProviderId && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm flex gap-3">
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <p>
              El usuario quedara asignado como docente de toda la materia y
              podra gestionarla sin seleccionar comisiones.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !selectedProfesor}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : isEditing ? (
                'Guardar Cambios'
              ) : (
                'Asignar Profesor'
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
