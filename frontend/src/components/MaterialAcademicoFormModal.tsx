import React, { useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, X } from 'lucide-react';
import { Button } from '../shared/design-system/components/Button';
import {
  materialAcademicoService,
  MaterialAcademico,
  CreateMaterialAcademicoDto,
  UpdateMaterialAcademicoDto,
} from '../services';
import { useToast } from '../hooks';
import { BlockEditor } from './BlockEditor';
import { ContentBlock, MaterialContent } from '../types/content-blocks';

export interface MaterialAcademicoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  material?: MaterialAcademico | null;
  materiaId?: number;
  materiales?: MaterialAcademico[];
}

export const MaterialAcademicoFormModal: React.FC<
  MaterialAcademicoFormModalProps
> = ({ isOpen, onClose, onSuccess, material, materiaId, materiales = [] }) => {
  const toast = useToast();
  const isEditing = !!material;

  const [formData, setFormData] = useState<CreateMaterialAcademicoDto>({
    titulo: '',
    descripcion: '',
    categoria: '',
    contenido: null,
    icono: '📚',
    color: 'blue',
    orden: 0,
    visible: true,
    materiaId: materiaId!,
  });

  // Estado para los bloques de contenido
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setFormData({
      titulo: '',
      descripcion: '',
      categoria: '',
      contenido: null,
      icono: 'book',
      color: 'blue',
      orden: 0,
      visible: true,
      materiaId: materiaId!,
    });
    setBlocks([]);
  }, [materiaId]);

  useEffect(() => {
    if (material) {
      setFormData({
        titulo: material.titulo,
        descripcion: material.descripcion || '',
        categoria: material.categoria || '',
        contenido: material.contenido,
        icono: material.icono || 'book',
        color: material.color || 'blue',
        orden: material.orden || 0,
        visible: material.visible,
        materiaId: material.materiaId || materiaId,
      });

      // Cargar bloques si existen
      if (material.contenido && material.contenido.blocks) {
        setBlocks(material.contenido.blocks);
      } else {
        setBlocks([]);
      }
    } else {
      resetForm();
    }
    setErrors({});
  }, [material, isOpen, materiaId, resetForm]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? parseInt(value) || 0
            : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (blocks.length === 0) {
      toast.error('Debes agregar al menos un bloque de contenido');
      return false;
    }

    if (!materiaId) {
      toast.error('Debes seleccionar una materia para crear el material');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCategoryOrder = (categoryName?: string): number => {
    const normalizedCategory = categoryName?.trim() || 'Sin categoria';
    const originalCategory = material?.categoria?.trim() || 'Sin categoria';

    if (material && normalizedCategory === originalCategory) {
      return material.orden ?? 0;
    }

    const matchingCategoryOrders = materiales
      .filter(item => item.id !== material?.id)
      .filter(
        item =>
          (item.categoria?.trim() || 'Sin categoria') === normalizedCategory
      )
      .map(item => item.orden ?? 0);

    if (matchingCategoryOrders.length > 0) {
      return Math.min(...matchingCategoryOrders);
    }

    const existingOrders = materiales
      .filter(item => item.id !== material?.id)
      .map(item => item.orden ?? 0);

    return existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor, corrige los errores del formulario');
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        contenido: { blocks } as MaterialContent,
        orden: getCategoryOrder(formData.categoria),
      };

      if (isEditing && material) {
        await materialAcademicoService.update(
          material.id,
          dataToSubmit as UpdateMaterialAcademicoDto
        );
        toast.success('Material actualizado exitosamente');
      } else {
        await materialAcademicoService.create(dataToSubmit);
        toast.success('Material creado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar material:', error);
      const errorMessage =
        error.response?.data?.message || 'Error al guardar el material';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-md transition-opacity dark:bg-slate-900/55"
        onClick={onClose}
      ></div>

      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-5xl transform transition-all">
          <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 dark:border-slate-600 dark:bg-slate-900 dark:shadow-slate-950/35 sm:max-h-[90dvh]">
            <div className="relative flex-shrink-0 overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.24),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#e0f2fe_52%,#d1fae5_100%)] dark:border-slate-600 dark:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.22),transparent_34%),linear-gradient(135deg,#1e293b_0%,#1d4ed8_52%,#0f766e_100%)] p-5 sm:p-7">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex min-w-0 items-center gap-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                  <svg
                    className="w-6 h-6 text-purple-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  {isEditing ? 'Editar Material' : 'Nuevo Material Académico'}
                </h2>
                <button
                  onClick={onClose}
                  className="relative rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition-all hover:bg-white hover:text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-purple-100">
                {isEditing
                  ? 'Modifica los detalles del material existente.'
                  : 'Crea un nuevo recurso académico con bloques de contenido flexibles.'}
              </p>
            </div>

            {/* Form Content - Scrollable */}
            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%),#f8fafc] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_30%),#111827] [scrollbar-color:#94a3b8_transparent] dark:[scrollbar-color:#64748b_transparent]"
            >
              <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                {/* Título */}
                <div>
                  <label
                    htmlFor="titulo"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all dark:bg-slate-800 dark:text-white placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 ${
                      errors.titulo
                        ? 'border-red-400 bg-red-500/10'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                    placeholder="Ej: Guía de Git y UML"
                  />
                  {errors.titulo && (
                    <p className="mt-1 text-sm text-red-500">{errors.titulo}</p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label
                    htmlFor="descripcion"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Descripción{' '}
                    <span className="text-gray-400 font-normal">
                      (Opcional)
                    </span>
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={2}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                    placeholder="Breve descripción del contenido..."
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label
                    htmlFor="categoria"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Categoría
                  </label>
                  <input
                    type="text"
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                    placeholder="Ej: Git, UML, Recursos..."
                  />
                </div>

                {/* Editor de Bloques */}
                <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white/80 dark:border-emerald-300/25 dark:bg-slate-800/70 p-4 shadow-2xl shadow-black/15 sm:p-6">
                  <BlockEditor
                    blocks={blocks}
                    onChange={setBlocks}
                    materiaId={materiaId}
                  />
                </div>

                {/* Personalización */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Icono (Emoji)
                    </label>
                    <input
                      type="text"
                      name="icono"
                      value={formData.icono}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none dark:text-white text-center text-2xl"
                      placeholder="📚"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Color
                    </label>
                    <select
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                    >
                      <option value="blue">Azul</option>
                      <option value="purple">Morado</option>
                      <option value="green">Verde</option>
                      <option value="orange">Naranja</option>
                      <option value="red">Rojo</option>
                      <option value="pink">Rosa</option>
                      <option value="gray">Gris</option>
                    </select>
                  </div>
                </div>

                {/* Visible */}
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 dark:border-slate-600 dark:bg-slate-800/70 p-4">
                  <input
                    type="checkbox"
                    id="visible"
                    name="visible"
                    checked={formData.visible}
                    onChange={handleChange}
                    className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-slate-800 dark:border-slate-600"
                  />
                  <label
                    htmlFor="visible"
                    className="cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Material visible para los estudiantes
                  </label>
                </div>
              </div>

              {/* Actions - Fixed at bottom */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900/95 p-4 sm:flex-row sm:justify-end sm:p-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  type="button"
                  disabled={loading}
                  className="w-full rounded-2xl border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
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
                      {isEditing ? 'Actualizar Material' : 'Crear Material'}
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

export default MaterialAcademicoFormModal;
