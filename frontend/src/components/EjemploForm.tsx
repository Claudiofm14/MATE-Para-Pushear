import React, { useState, useEffect } from 'react';
import { Button, TextInput, Textarea, Label } from 'flowbite-react';
import {
  CreateEjemploDto,
  UpdateEjemploDto,
  Ejemplo,
} from '../types/ejemplo.types';

interface EjemploFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEjemploDto | UpdateEjemploDto) => Promise<void>;
  ejemplo?: Ejemplo;
  mode: 'create' | 'edit';
}

export const EjemploForm: React.FC<EjemploFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ejemplo,
  mode,
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && ejemplo) {
      setFormData({
        nombre: ejemplo.nombre,
        descripcion: ejemplo.descripcion || '',
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
      });
    }
  }, [mode, ejemplo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit(formData);
      setFormData({ nombre: '', descripcion: '' });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-md mx-auto my-6">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t">
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'Crear Nuevo Ejemplo' : 'Editar Ejemplo'}
            </h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-400 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          {/* Body */}
          <div className="relative p-6 flex-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <TextInput
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ingrese el nombre del ejemplo"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Ingrese una descripción (opcional)"
                  rows={4}
                  className="mt-1"
                />
              </div>
            </form>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-solid border-gray-300 rounded-b">
            <Button color="gray" onClick={onClose} className="mr-3">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formData.nombre.trim()}
              onClick={handleSubmit}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {submitting
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear'
                  : 'Actualizar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
