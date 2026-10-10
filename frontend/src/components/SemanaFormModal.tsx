import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../shared/design-system/components/Button';
import {
  semanaService,
  comisionService,
  CreateSemanaDto,
  UpdateSemanaDto,
  Semana,
  Comision,
} from '../services';
import { useToast } from '../hooks';
import { BlockEditor } from './BlockEditor';
import { ContentBlock, MaterialContent } from '../types/content-blocks';

export interface SemanaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  semana?: Semana | null;
  cursadaId: number;
  materiaId?: number;
}

/**
 * Modal para crear o editar una semana
 * Incluye validaciones, manejo de errores y estados de carga
 */
export const SemanaFormModal: React.FC<SemanaFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  semana,
  cursadaId,
  materiaId,
}) => {
  const toast = useToast();
  const isEditing = !!semana;

  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    numeroSemana: 1,
    fechaInicio: '',
    horaInicio: '00:00',
    fechasClasePorComision: {} as Record<string, string>,
    importante: '',
    avisos: '',
    comisionIds: [] as number[],
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loadingComisiones, setLoadingComisiones] = useState(false);

  // Estado para los bloques de contenido
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // Cargar comisiones disponibles
  useEffect(() => {
    const loadComisiones = async () => {
      if (!cursadaId || !isOpen) return;
      setLoadingComisiones(true);
      try {
        const data = await comisionService.getByCursada(cursadaId);
        setComisiones(data);
      } catch (error) {
        console.error('Error al cargar comisiones:', error);
        toast.error('Error al cargar comisiones');
      } finally {
        setLoadingComisiones(false);
      }
    };
    loadComisiones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursadaId, isOpen]);

  // Helper para convertir fecha del backend a formato yyyy-MM-dd sin problemas de zona horaria
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    // Crear fecha en UTC y extraer componentes
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Cargar datos de la semana si estamos editando
  useEffect(() => {
    if (semana) {
      setFormData({
        titulo: semana.titulo,
        descripcion: semana.descripcion || '',
        numeroSemana: semana.numeroSemana,
        fechaInicio: formatDateForInput(semana.fechaInicio),
        horaInicio: '00:00',
        fechasClasePorComision: semana.fechasClasePorComision || {},
        importante: semana.importante || '',
        avisos: semana.avisos || '',
        comisionIds: semana.comisiones?.map(c => c.id) || [],
      });

      // Cargar bloques si existen
      if (semana.contenido?.blocks) {
        setBlocks(semana.contenido.blocks);
      } else {
        setBlocks([]);
      }
    } else {
      // Resetear formulario si no hay semana
      setFormData({
        titulo: '',
        descripcion: '',
        numeroSemana: 1,
        fechaInicio: '',
        horaInicio: '00:00',
        fechasClasePorComision: {},
        importante: '',
        avisos: '',
        comisionIds: [],
      });
      setBlocks([]);
    }
    setErrors({});
  }, [semana, isOpen]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numeroSemana' ? parseInt(value) || 0 : value,
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Manejar selección de comisiones
  const handleComisionToggle = (comisionId: number) => {
    setFormData(prev => {
      const isSelected = prev.comisionIds.includes(comisionId);
      const fechasClasePorComision = { ...prev.fechasClasePorComision };

      if (isSelected) {
        delete fechasClasePorComision[String(comisionId)];
      }

      return {
        ...prev,
        comisionIds: isSelected
          ? prev.comisionIds.filter(id => id !== comisionId)
          : [...prev.comisionIds, comisionId],
        fechasClasePorComision,
      };
    });
  };

  const handleToggleAllComisiones = () => {
    setFormData(prev => {
      const allSelected =
        comisiones.length > 0 &&
        comisiones.every(comision => prev.comisionIds.includes(comision.id));

      return {
        ...prev,
        comisionIds: allSelected ? [] : comisiones.map(comision => comision.id),
        fechasClasePorComision: allSelected ? {} : prev.fechasClasePorComision,
      };
    });
  };

  const handleClassDateChange = (comisionId: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      fechasClasePorComision: {
        ...prev.fechasClasePorComision,
        [String(comisionId)]: value,
      },
    }));
  };

  // Validar formulario
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }

    if (formData.numeroSemana < 1) {
      newErrors.numeroSemana = 'El número de semana debe ser mayor a 0';
    }

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      if (isEditing && semana) {
        // Actualizar semana existente
        const updateData: UpdateSemanaDto = {
          ...formData,
          horaInicio: '00:00',
          cursadaId,
          contenido:
            blocks.length > 0 ? ({ blocks } as MaterialContent) : undefined,
        };
        await semanaService.update(semana.id, updateData);
        toast.success('Semana actualizada exitosamente');
      } else {
        // Crear nueva semana
        const createData: CreateSemanaDto = {
          ...formData,
          horaInicio: '00:00',
          cursadaId,
          contenido:
            blocks.length > 0 ? ({ blocks } as MaterialContent) : undefined,
        };
        await semanaService.create(createData);
        toast.success('Semana creada exitosamente');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar semana:', error);
      const errorMessage =
        error.response?.data?.message || 'Error al guardar la semana';
      toast.error(errorMessage);
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
            <div className="relative flex-shrink-0 overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.24),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#e0f2fe_52%,#d1fae5_100%)] p-4 sm:p-6 dark:border-slate-600 dark:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.22),transparent_34%),linear-gradient(135deg,#1e293b_0%,#1d4ed8_52%,#0f766e_100%)]">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex min-w-0 items-center gap-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                  <svg
                    className="w-6 h-6 text-emerald-500 dark:text-emerald-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {isEditing ? 'Editar Semana' : 'Nueva Semana'}
                </h2>
                <button
                  onClick={onClose}
                  className="relative rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition-all hover:bg-white hover:text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white"
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
              <p className="mt-2 text-sm text-slate-600 dark:text-emerald-100/90">
                {isEditing
                  ? 'Modifica los detalles de la semana existente.'
                  : 'Crea una nueva semana para organizar el contenido.'}
              </p>
            </div>

            {/* Form Content */}
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
                    Título de la Semana <span className="text-red-500">*</span>
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
                    placeholder="Ej: Introducción a POO"
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
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all dark:bg-slate-800 dark:text-white placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 resize-none ${
                      errors.descripcion
                        ? 'border-red-400 bg-red-500/10'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                    placeholder="Descripción breve de los temas a tratar..."
                  />
                  {errors.descripcion && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.descripcion}
                    </p>
                  )}
                </div>

                {/* Número de Semana y Fechas */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Número de Semana */}
                  <div>
                    <label
                      htmlFor="numeroSemana"
                      className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Nº Semana <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="numeroSemana"
                      name="numeroSemana"
                      value={formData.numeroSemana}
                      onChange={handleChange}
                      min="1"
                      className={`w-full rounded-2xl border bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all dark:bg-slate-800 dark:text-white placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 ${
                        errors.numeroSemana
                          ? 'border-red-400 bg-red-500/10'
                          : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.numeroSemana && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.numeroSemana}
                      </p>
                    )}
                  </div>

                  {/* Fecha de publicacion */}
                  <div>
                    <label
                      htmlFor="fechaInicio"
                      className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Dia de publicacion <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="fechaInicio"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleChange}
                      className={`w-full rounded-2xl border bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all dark:bg-slate-800 dark:text-white dark:[color-scheme:dark] placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 ${
                        errors.fechaInicio
                          ? 'border-red-400 bg-red-500/10'
                          : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.fechaInicio && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.fechaInicio}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                      Los alumnos veran la semana desde las 00:00 de ese dia.
                    </p>
                  </div>
                </div>

                {/* Información Importante */}
                <div>
                  <label
                    htmlFor="importante"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    <span className="text-amber-500">⚠️</span> Información
                    Importante
                  </label>
                  <div className="relative">
                    <textarea
                      id="importante"
                      name="importante"
                      value={formData.importante}
                      onChange={handleChange}
                      rows={2}
                      className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-slate-900 outline-none transition-all dark:border-amber-800 dark:bg-amber-900/10 dark:text-white focus:border-amber-400 focus:ring-4 focus:ring-amber-300/10 resize-none"
                      placeholder="Ej: Recordar traer notebook para la práctica..."
                    />
                  </div>
                </div>

                {/* Avisos */}
                <div>
                  <label
                    htmlFor="avisos"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    <span className="text-blue-500">📢</span> Avisos Generales
                  </label>
                  <textarea
                    id="avisos"
                    name="avisos"
                    value={formData.avisos}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-slate-900 outline-none transition-all dark:border-emerald-800 dark:bg-emerald-900/10 dark:text-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-300/10 resize-none"
                    placeholder="Ej: La clase del miércoles será virtual..."
                  />
                </div>

                {/* Editor de Bloques de Contenido */}
                <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 dark:border-emerald-800 dark:from-emerald-900/10 dark:to-cyan-900/10 sm:p-6">
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-white">
                      <span className="text-2xl">📝</span>
                      Contenido de la Semana
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Agrega bloques de contenido rico para organizar el
                      material de la semana
                    </p>
                  </div>
                  <BlockEditor
                    blocks={blocks}
                    onChange={setBlocks}
                    materiaId={materiaId}
                  />
                </div>

                {/* Seleccion de Comisiones */}
                <div>
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                        Asignar a Comisiones
                      </label>
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
                        La fecha de clase se mostrara en la card de la semana
                        para los alumnos de cada comision.
                      </p>
                    </div>
                    {comisiones.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleAllComisiones}
                        className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
                      >
                        {comisiones.every(comision =>
                          formData.comisionIds.includes(comision.id)
                        )
                          ? 'Quitar todas'
                          : 'Marcar todas'}
                      </button>
                    )}
                  </div>
                  {loadingComisiones ? (
                    <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"></div>
                  ) : comisiones.length > 0 ? (
                    <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto p-1 sm:grid-cols-2">
                      {comisiones.map(comision => {
                        const selected = formData.comisionIds.includes(
                          comision.id
                        );

                        return (
                          <div
                            key={comision.id}
                            className={`rounded-2xl border p-3 transition-all ${
                              selected
                                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                                : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-900'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleComisionToggle(comision.id)}
                              className="flex w-full items-center gap-3 text-left"
                            >
                              <span
                                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                                  selected
                                    ? 'border-emerald-500 bg-emerald-500'
                                    : 'border-slate-300 dark:border-slate-500'
                                }`}
                              >
                                {selected && (
                                  <svg
                                    className="w-3 h-3 text-white"
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
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-slate-900 dark:text-white">
                                  {comision.nombre}
                                </span>
                                {comision.descripcion && (
                                  <span className="block truncate text-xs text-slate-500 dark:text-slate-300">
                                    {comision.descripcion}
                                  </span>
                                )}
                              </span>
                            </button>

                            {selected && (
                              <div className="mt-3">
                                <label
                                  htmlFor={`fecha-clase-${comision.id}`}
                                  className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300"
                                >
                                  Fecha de clase
                                </label>
                                <input
                                  id={`fecha-clase-${comision.id}`}
                                  type="date"
                                  value={
                                    formData.fechasClasePorComision[
                                      String(comision.id)
                                    ] || ''
                                  }
                                  onChange={e =>
                                    handleClassDateChange(
                                      comision.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-slate-300 p-4 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900/50 text-center">
                      No hay comisiones especificas. Se asignara a todas por
                      defecto.
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-300">
                    Si no seleccionas ninguna, la semana sera visible para todas
                    las comisiones, pero no tendra fecha de clase por comision.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-600 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    type="button"
                    disabled={loading}
                    className="w-full rounded-2xl border-slate-300 px-6 py-2.5 font-black text-slate-700 transition-all hover:bg-slate-50 sm:w-auto dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
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
                    ) : isEditing ? (
                      'Actualizar Semana'
                    ) : (
                      'Crear Semana'
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

export default SemanaFormModal;
