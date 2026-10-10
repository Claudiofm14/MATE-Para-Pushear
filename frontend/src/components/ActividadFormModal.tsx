import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import {
  Actividad,
  CreateActividadDto,
  UpdateActividadDto,
} from '../services/actividad.service';
import { Comision } from '../services/comision.service';

interface ActividadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateActividadDto | UpdateActividadDto) => Promise<void>;
  actividad?: Actividad | null;
  comisiones?: Comision[];
}

export const ActividadFormModal: React.FC<ActividadFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  actividad,
  comisiones = [],
}) => {
  const isEditing = Boolean(actividad);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [repositorioBase, setRepositorioBase] = useState('');
  const [tipoCalificacion, setTipoCalificacion] = useState<
    'numerico' | 'conceptual'
  >('numerico');
  const [selectedComisionIds, setSelectedComisionIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setNombre(actividad?.nombre || '');
    setDescripcion(actividad?.descripcion || '');
    setRepositorioBase(actividad?.repositorioBase || '');
    setTipoCalificacion(actividad?.tipoCalificacion || 'numerico');
    setSelectedComisionIds(actividad?.comisiones?.map(c => c.id) || []);
    setError(null);
  }, [isOpen, actividad]);

  const toggleComision = (comisionId: number) => {
    setSelectedComisionIds(prev =>
      prev.includes(comisionId)
        ? prev.filter(id => id !== comisionId)
        : [...prev, comisionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!repositorioBase.trim()) {
      setError('El repositorio base es obligatorio');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        nombre: nombre.trim(),
        // null y no undefined: axios descarta las claves undefined, y sin el
        // campo el backend conserva la descripcion anterior.
        descripcion: descripcion.trim() || null,
        repositorioBase: repositorioBase.trim(),
        tipoCalificacion,
        materiaId: 0,
        comisionIds: selectedComisionIds,
      });

      handleClose(true);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la actividad');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (force = false) => {
    if (!saving || force) {
      setNombre('');
      setDescripcion('');
      setRepositorioBase('');
      setTipoCalificacion('numerico');
      setSelectedComisionIds([]);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-900/35 p-3 backdrop-blur-md dark:bg-slate-900/55 sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 dark:border-slate-600 dark:bg-slate-900 dark:shadow-slate-950/35 sm:max-h-[90dvh]">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 dark:border-slate-700 sm:p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            {isEditing ? 'Editar Actividad' : 'Nueva Actividad'}
          </h3>
          <button
            onClick={() => handleClose()}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:space-y-6 sm:p-6"
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Nombre de la actividad *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              placeholder="ej: TP1 - Lista Enlazada"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Descripcion (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none"
              rows={3}
              placeholder="Descripcion de la actividad..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Repositorio Base *
            </label>
            <input
              type="text"
              value={repositorioBase}
              onChange={e => setRepositorioBase(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-mono text-sm"
              placeholder="http://gitea-unahur.duckdns.org/curso-obj2/tp1-"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-300">
              Se concatenara con el nombre de usuario de Gitea del alumno.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Comisiones
            </label>
            <div className="rounded-lg border border-gray-300 dark:border-slate-600 p-3 space-y-2">
              <button
                type="button"
                onClick={() => setSelectedComisionIds([])}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedComisionIds.length === 0
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-white'
                    : 'border-gray-200 text-gray-900 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-gray-700/50'
                }`}
              >
                Todas las comisiones
              </button>
              {comisiones.map(comision => (
                <button
                  type="button"
                  key={comision.id}
                  onClick={() => toggleComision(comision.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedComisionIds.includes(comision.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-white'
                      : 'border-gray-200 text-gray-900 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span>{comision.nombre}</span>
                  {selectedComisionIds.includes(comision.id) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Tipo de Calificacion *
            </label>
            <div className="space-y-3">
              {[
                ['numerico', 'Numerico', 'Escala 0-10 con decimales'],
                [
                  'conceptual',
                  'Conceptual',
                  'Aprobado/Desaprobado, Excelente/Muy Bueno/Bueno/Regular/Insuficiente',
                ],
              ].map(([value, title, description]) => (
                <label
                  key={value}
                  className="flex items-center gap-3 p-3 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <input
                    type="radio"
                    name="tipoCalificacion"
                    value={value}
                    checked={tipoCalificacion === value}
                    onChange={e =>
                      setTipoCalificacion(
                        e.target.value as 'numerico' | 'conceptual'
                      )
                    }
                    disabled={saving}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-slate-300">
                      {description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={() => handleClose()}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-sm disabled:opacity-50"
            >
              {saving
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar Cambios'
                  : 'Crear Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
