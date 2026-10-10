import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../shared/design-system/components/Button';
import {
  cursadaService,
  comisionService,
  CreateCursadaDto,
  UpdateCursadaDto,
  Cursada,
  GiteaOrganization,
} from '../services';
import { useToast } from '../hooks';
import { ExternalLink, Plus, Trash2, StopCircle } from 'lucide-react';

export interface CursadaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cursada?: Cursada | null;
  materiaId: number;
}

interface ComisionFormState {
  id?: number;
  nombre: string;
  descripcion: string;
  deleted?: boolean; // Para marcar comisiones a eliminar
}

/**
 * Modal para crear o editar una cursada
 * Permite configurar título, descripción y gestionar comisiones
 */
export const CursadaFormModal: React.FC<CursadaFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  cursada,
  materiaId,
}) => {
  const toast = useToast();
  const isEditing = !!cursada;

  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    activa: true,
    fechaInicio: '',
    fechaFin: '',
    cantidadComisiones: 1,
    giteaIntegrationEnabled: false,
    giteaOrgName: '',
    giteaOrgUrl: '',
  });

  // Estados de comisiones
  const [comisiones, setComisiones] = useState<ComisionFormState[]>([
    { nombre: 'Comisión 1', descripcion: '' },
  ]);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [giteaOrgs, setGiteaOrgs] = useState<GiteaOrganization[]>([]);
  const [loadingGiteaOrgs, setLoadingGiteaOrgs] = useState(false);

  // Cargar datos de la cursada si estamos editando
  const loadComisiones = useCallback(async () => {
    if (!cursada) return;
    try {
      const data = await comisionService.getByCursada(cursada.id);
      if (data.length > 0) {
        setComisiones(
          data.map(c => ({
            id: c.id,
            nombre: c.nombre,
            descripcion: c.descripcion || '',
          }))
        );
      }
    } catch (error) {
      console.error('Error al cargar comisiones:', error);
    }
  }, [cursada]);

  useEffect(() => {
    if (cursada && isOpen) {
      setFormData({
        titulo: cursada.titulo,
        descripcion: cursada.descripcion || '',
        activa: cursada.activa,
        fechaInicio: cursada.fechaInicio || '',
        fechaFin: cursada.fechaFin || '',
        giteaIntegrationEnabled: !!cursada.giteaIntegrationEnabled,
        giteaOrgName: cursada.giteaOrgName || '',
        giteaOrgUrl: cursada.giteaOrgUrl || '',
        cantidadComisiones: 1, // No se usa en edición
      });
      // Cargar comisiones existentes
      loadComisiones();
    } else if (!cursada && isOpen) {
      // Resetear formulario
      setFormData({
        titulo: '',
        descripcion: '',
        activa: true,
        fechaInicio: '',
        fechaFin: '',
        giteaIntegrationEnabled: false,
        giteaOrgName: '',
        giteaOrgUrl: '',
        cantidadComisiones: 1,
      });
      setComisiones([{ nombre: 'Comisión 1', descripcion: '' }]);
    }
    setErrors({});
  }, [cursada, isOpen, loadComisiones]);

  useEffect(() => {
    if (!isOpen) return;
    const loadGiteaOrgs = async () => {
      setLoadingGiteaOrgs(true);
      try {
        const orgs = await cursadaService.listGiteaOrgs();
        setGiteaOrgs(orgs);
      } catch (error) {
        console.error('Error al cargar organizaciones de Gitea:', error);
      } finally {
        setLoadingGiteaOrgs(false);
      }
    };
    loadGiteaOrgs();
  }, [isOpen]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidadComisiones' ? parseInt(value) || 1 : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Manejar cambio en cantidad de comisiones (solo creación inicial)
  const handleCantidadComisionesChange = (cantidad: number) => {
    const newCantidad = Math.max(1, Math.min(10, cantidad));
    setFormData(prev => ({ ...prev, cantidadComisiones: newCantidad }));

    // Ajustar array de comisiones
    const newComisiones = Array.from({ length: newCantidad }, (_, i) => {
      if (i < comisiones.length) {
        return comisiones[i];
      }
      return { nombre: `Comisión ${i + 1}`, descripcion: '' };
    });
    setComisiones(newComisiones);
  };

  // Agregar nueva comisión manualmente
  const handleAddComision = () => {
    setComisiones(prev => [
      ...prev,
      { nombre: `Comisión ${prev.length + 1}`, descripcion: '' },
    ]);
  };

  // Eliminar comisión
  const handleRemoveComision = (index: number) => {
    setComisiones(prev => {
      const newComisiones = [...prev];
      const comision = newComisiones[index];

      if (comision.id) {
        // Si tiene ID (existe en BD), la marcamos como eliminada
        newComisiones[index] = { ...comision, deleted: true };
      } else {
        // Si es nueva, la eliminamos del array
        newComisiones.splice(index, 1);
      }
      return newComisiones;
    });
  };

  // Manejar cambios en comisiones
  const handleComisionChange = (
    index: number,
    field: 'nombre' | 'descripcion',
    value: string
  ) => {
    setComisiones(prev => {
      const newComisiones = [...prev];
      newComisiones[index] = { ...newComisiones[index], [field]: value };
      return newComisiones;
    });
  };

  const normalizeSlug = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

  const handleCreateGiteaOrg = async () => {
    const slug = normalizeSlug(formData.titulo);
    if (!slug) {
      toast.error('Ingresa un titulo de cursada para sugerir la organizacion');
      return;
    }

    setLoadingGiteaOrgs(true);
    try {
      const org = await cursadaService.createGiteaOrg({
        name: slug,
        fullName: formData.titulo,
        description: formData.descripcion,
      });
      setGiteaOrgs(prev => {
        if (prev.some(item => item.username === org.username)) return prev;
        return [...prev, org];
      });
      setFormData(prev => ({
        ...prev,
        giteaIntegrationEnabled: true,
        giteaOrgName: org.username,
        giteaOrgUrl: org.html_url || '',
      }));
      toast.success('Organizacion de Gitea creada');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'No se pudo crear la organizacion'
      );
    } finally {
      setLoadingGiteaOrgs(false);
    }
  };

  // Validar formulario
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (
      formData.fechaInicio &&
      formData.fechaFin &&
      formData.fechaInicio > formData.fechaFin
    ) {
      newErrors.fechaFin =
        'La fecha de fin no puede ser anterior a la fecha de inicio';
    }

    if (!isEditing && formData.cantidadComisiones < 1) {
      newErrors.cantidadComisiones = 'Debe haber al menos 1 comisión';
    }

    // Validar nombres de comisiones (solo las no eliminadas)
    const activeComisiones = comisiones.filter(c => !c.deleted);
    if (activeComisiones.length === 0) {
      newErrors.comisiones = 'Debe haber al menos una comisión activa';
    }

    comisiones.forEach((comision, index) => {
      if (!comision.deleted && !comision.nombre.trim()) {
        newErrors[`comision_${index}`] =
          'El nombre de la comisión es obligatorio';
      }
    });

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
      if (isEditing && cursada) {
        // 1. Actualizar cursada
        const updateData: UpdateCursadaDto = {
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          activa: formData.activa,
          // null y no undefined: axios descarta las claves undefined, y sin el
          // campo el backend conserva la fecha anterior.
          fechaInicio: formData.fechaInicio || null,
          fechaFin: formData.fechaFin || null,
          giteaIntegrationEnabled: formData.giteaIntegrationEnabled,
          giteaOrgName: formData.giteaIntegrationEnabled
            ? formData.giteaOrgName
            : '',
          giteaOrgUrl: formData.giteaIntegrationEnabled
            ? formData.giteaOrgUrl
            : '',
        };
        await cursadaService.update(cursada.id, updateData);

        // 2. Gestionar comisiones
        for (const comision of comisiones) {
          if (comision.deleted && comision.id) {
            // Eliminar comisión existente
            await comisionService.delete(comision.id);
          } else if (!comision.deleted && !comision.id) {
            // Crear nueva comisión
            await comisionService.create({
              nombre: comision.nombre,
              descripcion: comision.descripcion,
              cursadaId: cursada.id,
            });
          } else if (!comision.deleted && comision.id) {
            // Actualizar comisión existente (opcional, si cambió)
            // Por simplicidad actualizamos siempre
            await comisionService.update(comision.id, {
              nombre: comision.nombre,
              descripcion: comision.descripcion,
            });
          }
        }

        toast.success('Cursada actualizada exitosamente');
      } else {
        // Crear nueva cursada
        const createData: CreateCursadaDto = {
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          activa: formData.activa,
          fechaInicio: formData.fechaInicio || null,
          fechaFin: formData.fechaFin || null,
          giteaIntegrationEnabled: formData.giteaIntegrationEnabled,
          giteaOrgName: formData.giteaIntegrationEnabled
            ? formData.giteaOrgName
            : '',
          giteaOrgUrl: formData.giteaIntegrationEnabled
            ? formData.giteaOrgUrl
            : '',
          materiaId,
        };
        const newCursada = await cursadaService.create(createData);

        // Crear comisiones
        for (const comision of comisiones) {
          if (!comision.deleted) {
            await comisionService.create({
              nombre: comision.nombre,
              descripcion: comision.descripcion,
              cursadaId: newCursada.id,
            });
          }
        }

        toast.success('Cursada creada exitosamente con sus comisiones');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar cursada:', error);
      toast.error(
        error.response?.data?.message || 'Error al guardar la cursada'
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación de cursada
  const handleFinalizarCursada = async () => {
    if (!cursada) return;

    if (
      window.confirm(
        '¿Estás seguro de que deseas finalizar esta cursada? Los alumnos no podrán volver a acceder y luego podrás crear una nueva cursada.'
      )
    ) {
      setLoading(true);
      try {
        await cursadaService.finalizar(cursada.id);
        toast.success('Cursada finalizada exitosamente');
        onSuccess();
        onClose();
      } catch (error: any) {
        console.error('Error al finalizar cursada:', error);
        toast.error(
          error.response?.data?.message || 'Error al finalizar la cursada'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  // Filtrar comisiones visibles (no eliminadas)
  const visibleComisiones = comisiones
    .map((c, i) => ({ ...c, originalIndex: i }))
    .filter(c => !c.deleted);

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay con blur */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-md transition-opacity dark:bg-slate-900/55"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-5xl transform transition-all">
          <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 dark:border-slate-600 dark:bg-slate-900 dark:shadow-slate-950/35 sm:max-h-[90dvh]">
            {/* Header Premium */}
            <div className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.24),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#e0f2fe_52%,#d1fae5_100%)] p-5 sm:p-7 dark:border-slate-600 dark:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.22),transparent_34%),linear-gradient(135deg,#1e293b_0%,#1d4ed8_52%,#0f766e_100%)]">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-950 dark:text-white">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {isEditing ? 'Editar Cursada' : 'Iniciar Nueva Cursada'}
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
                  ? 'Modifica los detalles y comisiones de la cursada.'
                  : 'Configura una nueva cursada y sus comisiones iniciales.'}
              </p>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%),#f8fafc] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_30%),#111827] [scrollbar-color:#94a3b8_transparent] dark:[scrollbar-color:#64748b_transparent]"
            >
              <div className="space-y-6 p-4 sm:p-6">
                {/* Título */}
                <div>
                  <label
                    htmlFor="titulo"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Título de la Cursada <span className="text-red-500">*</span>
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
                    placeholder="Ej: Cursada 2025 - 1er Cuatrimestre"
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
                    <span className="font-normal text-slate-400">
                      (Opcional)
                    </span>
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-white placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 resize-none"
                    placeholder="Descripción de la cursada"
                  />
                </div>

                {/* Estado Activa (solo en edición) */}
                {/* Fechas de cursada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="fechaInicio"
                      className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Fecha de inicio{' '}
                      <span className="font-normal text-slate-400">
                        (Opcional)
                      </span>
                    </label>
                    <input
                      type="date"
                      id="fechaInicio"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark] focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="fechaFin"
                      className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Fecha de fin{' '}
                      <span className="font-normal text-slate-400">
                        (Opcional)
                      </span>
                    </label>
                    <input
                      type="date"
                      id="fechaFin"
                      name="fechaFin"
                      value={formData.fechaFin}
                      onChange={handleChange}
                      className={`w-full rounded-2xl border bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all dark:bg-slate-800 dark:text-white placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 ${
                        errors.fechaFin
                          ? 'border-red-400 bg-red-500/10'
                          : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.fechaFin && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.fechaFin}
                      </p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="activa"
                        checked={formData.activa}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            activa: e.target.checked,
                          }))
                        }
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="activa"
                        className="font-medium text-slate-700 dark:text-slate-300"
                      >
                        Cursada Activa
                      </label>
                      <p className="text-slate-500 dark:text-slate-300">
                        Si está activa, será visible para los estudiantes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cantidad de Comisiones (solo en creación inicial) */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Integracion con Gitea
                      </h3>
                      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                        Los ejercicios de esta cursada podran usar plantillas de
                        repositorios guardadas en esta organizacion.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={formData.giteaIntegrationEnabled}
                        onChange={event =>
                          setFormData(prev => ({
                            ...prev,
                            giteaIntegrationEnabled: event.target.checked,
                          }))
                        }
                        className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Usar organizacion
                    </label>
                  </div>

                  {formData.giteaIntegrationEnabled && (
                    <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                      <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-200">
                          Organizacion de Gitea
                        </span>
                        <select
                          value={formData.giteaOrgName}
                          onChange={event => {
                            const org = giteaOrgs.find(
                              item => item.username === event.target.value
                            );
                            setFormData(prev => ({
                              ...prev,
                              giteaOrgName: event.target.value,
                              giteaOrgUrl: org?.html_url || '',
                            }));
                          }}
                          disabled={loadingGiteaOrgs}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="">
                            {loadingGiteaOrgs
                              ? 'Cargando organizaciones...'
                              : 'Seleccionar organizacion'}
                          </option>
                          {giteaOrgs.map(org => (
                            <option key={org.username} value={org.username}>
                              {org.full_name || org.username}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={handleCreateGiteaOrg}
                        disabled={loadingGiteaOrgs || !formData.titulo.trim()}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                      >
                        Crear organizacion
                      </button>

                      {formData.giteaOrgUrl && (
                        <a
                          href={formData.giteaOrgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-200"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver en Gitea
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Cantidad Inicial de Comisiones
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.cantidadComisiones}
                          onChange={e =>
                            handleCantidadComisionesChange(
                              parseInt(e.target.value)
                            )
                          }
                          className="w-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-medium text-slate-900 outline-none transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                        />
                        <div className="absolute inset-y-0 right-0 flex flex-col border-l border-gray-200 dark:border-slate-600">
                          <button
                            type="button"
                            onClick={() =>
                              handleCantidadComisionesChange(
                                formData.cantidadComisiones + 1
                              )
                            }
                            className="flex-1 rounded-tr-xl px-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCantidadComisionesChange(
                                formData.cantidadComisiones - 1
                              )
                            }
                            className="flex-1 rounded-br-xl px-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-300">
                        Se crearán {formData.cantidadComisiones} comisiones
                        automáticamente.
                      </span>
                    </div>
                  </div>
                )}

                {/* Configuración de Comisiones */}
                <div className="border-t border-slate-200 pt-6 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-white">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </span>
                      Comisiones
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddComision}
                      className="rounded-lg border-2 border-dashed border-slate-300 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-600 dark:hover:border-emerald-300 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Comisión
                    </Button>
                  </div>

                  {errors.comisiones && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.comisiones}
                    </div>
                  )}

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {visibleComisiones.map(comision => (
                      <div
                        key={comision.originalIndex}
                        className="group relative rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-900/30"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveComision(comision.originalIndex)
                          }
                          className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                          title="Eliminar comisión"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 gap-4 pr-8 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                              Nombre <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={comision.nombre}
                              onChange={e =>
                                handleComisionChange(
                                  comision.originalIndex,
                                  'nombre',
                                  e.target.value
                                )
                              }
                              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all dark:bg-slate-900 dark:text-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 ${
                                errors[`comision_${comision.originalIndex}`]
                                  ? 'border-red-400'
                                  : 'border-slate-200 dark:border-slate-600'
                              }`}
                              placeholder="Ej: Comisión Lunes"
                            />
                            {errors[`comision_${comision.originalIndex}`] && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors[`comision_${comision.originalIndex}`]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                              Descripción
                            </label>
                            <input
                              type="text"
                              value={comision.descripcion}
                              onChange={e =>
                                handleComisionChange(
                                  comision.originalIndex,
                                  'descripcion',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                              placeholder="Ej: Lunes y Miércoles 18-20hs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                    {isEditing && cursada?.activa && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={handleFinalizarCursada}
                        disabled={loading}
                        className="w-full sm:w-auto rounded-xl border-amber-300 px-4 py-2 text-amber-700 transition-all hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        Finalizar
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      type="button"
                      disabled={loading}
                      className="w-full sm:w-auto rounded-xl border-slate-300 px-6 py-2.5 font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto rounded-xl border-none bg-emerald-400 px-6 py-2.5 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300"
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
                        'Actualizar Cursada'
                      ) : (
                        'Crear Cursada'
                      )}
                    </Button>
                  </div>
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

export default CursadaFormModal;
