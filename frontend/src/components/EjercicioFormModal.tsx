import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../shared/design-system/components/Button';
import {
  ejercicioService,
  CreateEjercicioDto,
  UpdateEjercicioDto,
  Ejercicio,
  GiteaTemplateRepo,
  TipoActividadEjercicio,
  TipoRecursoEjercicio,
} from '../services';
import { useToast } from '../hooks';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Table2,
} from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
}

interface StyledSelectProps {
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  accent?: 'blue' | 'violet';
}

const StyledSelect: React.FC<StyledSelectProps> = ({
  value,
  options,
  placeholder,
  onChange,
  accent = 'blue',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find(option => option.value === value);
  const accentClasses =
    accent === 'violet'
      ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/50'
      : 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/50';

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const open = () => {
    const selectedIndex = options.findIndex(option => option.value === value);
    setActiveIndex(Math.max(selectedIndex, 0));
    setIsOpen(true);
  };

  const selectOption = (option: SelectOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!options.length) return;
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) return open();
      setActiveIndex(current =>
        event.key === 'ArrowDown'
          ? (current + 1) % options.length
          : (current - 1 + options.length) % options.length
      );
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && isOpen) {
      event.preventDefault();
      if (options[activeIndex]) selectOption(options[activeIndex]);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={!options.length}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        onKeyDown={handleKeyDown}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-800 dark:text-white ${
          isOpen
            ? accentClasses
            : 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500'
        }`}
      >
        <span
          className={selectedOption ? '' : 'text-slate-500 dark:text-slate-400'}
        >
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/20 [scrollbar-color:#94a3b8_transparent] dark:border-slate-600 dark:bg-slate-800 dark:shadow-black/50"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            const active = index === activeIndex;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  selected
                    ? accentClasses
                    : active
                      ? 'bg-slate-100 dark:bg-slate-700/80'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? accent === 'violet'
                        ? 'border-violet-600 bg-violet-600 text-white dark:border-violet-400 dark:bg-violet-500'
                        : 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500'
                      : 'border-slate-300 text-transparent dark:border-slate-500'
                  }`}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="mt-0.5 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                      {option.description}
                    </span>
                  )}
                </span>
                {option.badge && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {option.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export interface EjercicioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ejercicio?: Ejercicio | null;
  semanaId: number;
  cursadaId?: number;
}

const activityOptions: Array<{
  value: TipoActividadEjercicio;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'programacion',
    title: 'Programacion con Gitea',
    description: 'Plantilla, repositorio privado por alumno y commits.',
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    value: 'enlace',
    title: 'Enlace externo',
    description: 'Formulario, sitio, recurso web o consigna externa.',
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    value: 'archivo',
    title: 'Archivo o planilla',
    description: 'Planilla, documento, PDF o presentacion compartida.',
    icon: <Table2 className="h-5 w-5" />,
  },
  {
    value: 'instrucciones',
    title: 'Solo instrucciones',
    description: 'Actividad sin enlace obligatorio.',
    icon: <FileText className="h-5 w-5" />,
  },
];

const resourceTypeOptions: Array<{
  value: TipoRecursoEjercicio;
  label: string;
}> = [
  { value: 'planilla', label: 'Planilla' },
  { value: 'documento', label: 'Documento' },
  { value: 'presentacion', label: 'Presentacion' },
  { value: 'pdf', label: 'PDF' },
  { value: 'video', label: 'Video' },
  { value: 'otro', label: 'Otro' },
];

/**
 * Modal para crear o editar un ejercicio
 */
export const EjercicioFormModal: React.FC<EjercicioFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ejercicio,
  semanaId,
  cursadaId,
}) => {
  const toast = useToast();
  const isEditing = !!ejercicio;

  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipoActividad: 'programacion' as TipoActividadEjercicio,
    recursoTipo: 'planilla' as TipoRecursoEjercicio,
    recursoUrl: '',
    recursoTitulo: '',
    repositorioEjemplo: '',
    readmeUrl: '',
    fechaEntrega: '',
    giteaTemplateRepo: '',
    assignmentMode: 'individual' as 'individual' | 'group',
    minGroupSize: 2,
    maxGroupSize: 4,
    groupsLockedAt: '',
    allowStudentGroupCreation: true,
    allowLeaveAfterRepositoryCreation: false,
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<GiteaTemplateRepo[]>([]);
  const [templatesMessage, setTemplatesMessage] = useState<string | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesOrg, setTemplatesOrg] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [templatesReloadToken, setTemplatesReloadToken] = useState(0);
  const tituloRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Marca solo la proxima consulta como refresco manual: sin esto, un click en
  // "Actualizar" dejaba salteado el cache del backend por el resto de la sesion.
  const forceRefreshRef = useRef(false);

  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  /** Plantilla elegida que ya no aparece en el listado de la organización. */
  const missingTemplate =
    !templatesLoading &&
    formData.giteaTemplateRepo &&
    !templates.some(item => item.name === formData.giteaTemplateRepo)
      ? formData.giteaTemplateRepo
      : null;

  // Cargar datos del ejercicio si estamos editando
  useEffect(() => {
    if (ejercicio && isOpen) {
      setFormData({
        titulo: ejercicio.titulo,
        descripcion: ejercicio.descripcion,
        tipoActividad: ejercicio.tipoActividad || 'programacion',
        recursoTipo: ejercicio.recursoTipo || 'planilla',
        recursoUrl: ejercicio.recursoUrl || '',
        recursoTitulo: ejercicio.recursoTitulo || '',
        repositorioEjemplo: ejercicio.repositorioEjemplo || '',
        readmeUrl: ejercicio.readmeUrl || '',
        fechaEntrega: formatDateForInput(ejercicio.fechaEntrega),
        giteaTemplateRepo: ejercicio.giteaTemplateRepo || '',
        assignmentMode: ejercicio.assignmentMode || 'individual',
        minGroupSize: ejercicio.minGroupSize || 2,
        maxGroupSize: ejercicio.maxGroupSize || 4,
        groupsLockedAt: ejercicio.groupsLockedAt
          ? ejercicio.groupsLockedAt.slice(0, 16)
          : '',
        allowStudentGroupCreation: ejercicio.allowStudentGroupCreation ?? true,
        allowLeaveAfterRepositoryCreation:
          ejercicio.allowLeaveAfterRepositoryCreation ?? false,
      });
    } else if (!ejercicio && isOpen) {
      setFormData({
        titulo: '',
        descripcion: '',
        tipoActividad: 'programacion',
        recursoTipo: 'planilla',
        recursoUrl: '',
        recursoTitulo: '',
        repositorioEjemplo: '',
        readmeUrl: '',
        fechaEntrega: '',
        giteaTemplateRepo: '',
        assignmentMode: 'individual',
        minGroupSize: 2,
        maxGroupSize: 4,
        groupsLockedAt: '',
        allowStudentGroupCreation: true,
        allowLeaveAfterRepositoryCreation: false,
      });
    }
    setErrors({});
  }, [ejercicio, isOpen]);

  useEffect(() => {
    if (!isOpen || !cursadaId) return;

    // Sin cancelacion, cerrar y reabrir el modal deja dos consultas en vuelo y
    // la mas vieja puede pisar el resultado de la mas nueva.
    const controller = new AbortController();
    let cancelled = false;

    setTemplatesLoading(true);
    ejercicioService
      .getTemplatesByCursada(cursadaId, {
        refresh: forceRefreshRef.current,
        signal: controller.signal,
      })
      .then(response => {
        if (cancelled) return;
        setTemplates(response.templates || []);
        setTemplatesMessage(response.message || null);
        setTemplatesOrg(response.organization);
      })
      .catch((error: any) => {
        if (cancelled || error.name === 'CanceledError') return;
        setTemplates([]);
        setTemplatesOrg(null);
        setTemplatesMessage(
          error.response?.data?.message || 'No se pudieron cargar plantillas'
        );
      })
      .finally(() => {
        forceRefreshRef.current = false;
        if (!cancelled) setTemplatesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isOpen, cursadaId, templatesReloadToken]);

  // Cerrar con Escape (es lo primero que intenta cualquiera para salir de un
  // modal, y este solo se podia cerrar con el mouse) y mantener el tabulador
  // dentro del dialogo, para no terminar navegando la pagina de atras.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (
        event.shiftKey &&
        (active === first || active === document.body)
      ) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, loading, onClose]);

  // Evita que el fondo siga scrolleando detras del modal.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // El foco quedaba en el body: quien navega con teclado tenia que tabular a
  // ciegas desde el principio de la pagina para llegar al formulario.
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => tituloRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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

    if (formData.tipoActividad === 'programacion') {
      const hasAnyUrl =
        formData.repositorioEjemplo ||
        formData.readmeUrl ||
        formData.giteaTemplateRepo;
      if (!hasAnyUrl) {
        newErrors.general =
          'Elegí una plantilla de Gitea o cargá un repositorio de ejemplo o un README con la consigna.';
      }
    }

    if (formData.assignmentMode === 'group') {
      if (formData.minGroupSize < 1) {
        newErrors.groupSize = 'El mínimo de integrantes debe ser al menos 1';
      } else if (formData.maxGroupSize < formData.minGroupSize) {
        newErrors.groupSize =
          'El máximo de integrantes no puede ser menor que el mínimo';
      }
    }

    if (
      (formData.tipoActividad === 'enlace' ||
        formData.tipoActividad === 'archivo') &&
      !formData.recursoUrl.trim()
    ) {
      newErrors.recursoUrl = 'El enlace del recurso es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const buildGiteaTemplatePayload = () => {
    if (
      formData.tipoActividad !== 'programacion' ||
      !formData.giteaTemplateRepo
    ) {
      return {
        giteaAutoCreateRepo: false,
        giteaTemplateOwner: '',
        giteaTemplateRepo: '',
        giteaTemplateRepoId: '',
        giteaTemplateCloneUrl: '',
      };
    }

    const template = templates.find(
      item => item.name === formData.giteaTemplateRepo
    );

    // Si la plantilla configurada no vino en el listado (Gitea caido, cache
    // vencido, plantilla renombrada) se conservan los datos que ya tenia el
    // ejercicio. Antes se guardaba owner y clone_url vacios, y el ejercicio
    // quedaba sin poder generar repositorios con solo abrir y guardar.
    const previous =
      ejercicio?.giteaTemplateRepo === formData.giteaTemplateRepo
        ? ejercicio
        : undefined;

    return {
      giteaAutoCreateRepo: true,
      giteaTemplateOwner:
        template?.full_name?.split('/')[0] ||
        template?.full_name ||
        previous?.giteaTemplateOwner ||
        '',
      giteaTemplateRepo: template?.name || formData.giteaTemplateRepo,
      giteaTemplateRepoId: template?.id
        ? String(template.id)
        : previous?.giteaTemplateRepoId || '',
      giteaTemplateCloneUrl:
        template?.clone_url || previous?.giteaTemplateCloneUrl || '',
    };
  };

  const buildPayload = () => ({
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    tipoActividad: formData.tipoActividad,
    recursoTipo:
      formData.tipoActividad === 'archivo' ||
      formData.tipoActividad === 'enlace'
        ? formData.recursoTipo
        : undefined,
    recursoUrl:
      formData.tipoActividad === 'archivo' ||
      formData.tipoActividad === 'enlace'
        ? formData.recursoUrl
        : undefined,
    recursoTitulo:
      formData.tipoActividad === 'archivo' ||
      formData.tipoActividad === 'enlace'
        ? formData.recursoTitulo
        : undefined,
    repositorioEjemplo:
      formData.tipoActividad === 'programacion'
        ? formData.repositorioEjemplo
        : '',
    readmeUrl:
      formData.tipoActividad === 'programacion' ||
      formData.tipoActividad === 'instrucciones'
        ? formData.readmeUrl
        : '',
    ...(formData.fechaEntrega && { fechaEntrega: formData.fechaEntrega }),
    ...buildGiteaTemplatePayload(),
    assignmentMode: formData.assignmentMode,
    ...(formData.assignmentMode === 'group'
      ? {
          minGroupSize: Number(formData.minGroupSize),
          maxGroupSize: Number(formData.maxGroupSize),
          ...(formData.groupsLockedAt && {
            groupsLockedAt: new Date(formData.groupsLockedAt).toISOString(),
          }),
          allowStudentGroupCreation: formData.allowStudentGroupCreation,
          allowLeaveAfterRepositoryCreation:
            formData.allowLeaveAfterRepositoryCreation,
        }
      : {}),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor, corrige los errores del formulario');
      // El formulario es largo y scrollea: sin esto el docente recibe el aviso
      // pero el campo con problemas puede quedar fuera de la vista.
      window.requestAnimationFrame(() => {
        const firstError = formRef.current?.querySelector<HTMLElement>(
          '[data-error="true"]'
        );
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError?.focus?.();
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditing && ejercicio) {
        const updateData: UpdateEjercicioDto = {
          ...buildPayload(),
        };
        await ejercicioService.update(ejercicio.id, updateData);
        toast.success('Ejercicio actualizado exitosamente');
      } else {
        const createData: CreateEjercicioDto = {
          ...buildPayload(),
          semanaId,
        };
        await ejercicioService.create(createData);
        toast.success('Ejercicio creado exitosamente');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar ejercicio:', error);
      toast.error(
        error.response?.data?.message || 'Error al guardar el ejercicio'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay con blur */}
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-md transition-opacity dark:bg-slate-900/55"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full max-w-5xl transform transition-all"
        >
          <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 dark:border-slate-600 dark:bg-slate-900 dark:shadow-slate-950/35 sm:max-h-[90dvh]">
            {/* Header Premium */}
            <div className="relative flex-shrink-0 overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#dbeafe_52%,#bfdbfe_100%)] p-4 sm:p-6 dark:border-slate-600 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_34%),linear-gradient(135deg,#1e293b_0%,#1d4ed8_52%,#0f766e_100%)]">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="flex items-start justify-between gap-3">
                <h2
                  id={titleId}
                  className="flex min-w-0 items-center gap-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl"
                >
                  <Code2 className="h-6 w-6 text-blue-500 dark:text-white" />
                  {isEditing ? 'Editar Ejercicio' : 'Crear Nuevo Ejercicio'}
                </h2>
                <button
                  onClick={onClose}
                  className="relative rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition-all hover:bg-white hover:text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <svg
                    className="h-6 w-6"
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
              <p className="mt-2 text-sm text-slate-600 dark:text-blue-100/90">
                {isEditing
                  ? 'Modifica los detalles del ejercicio práctico.'
                  : 'Crea un nuevo ejercicio para que los estudiantes practiquen.'}
              </p>
            </div>

            {/* Form Content */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%),#f8fafc] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_30%),#111827] [scrollbar-color:#94a3b8_transparent] dark:[scrollbar-color:#64748b_transparent]"
            >
              <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                {/* Título */}
                <div>
                  <label
                    htmlFor="titulo"
                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Título del Ejercicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={tituloRef}
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    data-error={errors.titulo ? 'true' : undefined}
                    aria-invalid={!!errors.titulo}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white ${
                      errors.titulo
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-slate-600'
                    }`}
                    placeholder="Ej: Ejercicio 1 - Clases y Objetos"
                  />
                  {errors.titulo && (
                    <p className="mt-1 text-sm text-red-500">{errors.titulo}</p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label
                    htmlFor="descripcion"
                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={4}
                    data-error={errors.descripcion ? 'true' : undefined}
                    aria-invalid={!!errors.descripcion}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white resize-none ${
                      errors.descripcion
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-slate-600'
                    }`}
                    placeholder="Describe el ejercicio, objetivos y requisitos..."
                  />
                  {errors.descripcion && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.descripcion}
                    </p>
                  )}
                </div>

                {/* Divider y título para campos */}
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                    <BookOpen className="h-4 w-4" />
                    Tipo de actividad
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activityOptions.map(option => {
                      const selected = formData.tipoActividad === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              tipoActividad: option.value,
                            }))
                          }
                          className={`flex min-h-[96px] items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                            selected
                              ? 'border-blue-500 bg-blue-50 text-blue-950 shadow-sm dark:border-blue-400 dark:bg-blue-950/45 dark:text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-blue-700'
                          }`}
                        >
                          <span
                            className={`mt-0.5 rounded-xl p-2 ${
                              selected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                            }`}
                          >
                            {option.icon}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-black">
                              {option.title}
                            </span>
                            <span className="mt-1 block text-xs font-semibold opacity-75">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 dark:border-slate-600">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400 dark:text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Configuracion de la actividad
                  </h3>
                  {errors.general && (
                    <p
                      data-error="true"
                      tabIndex={-1}
                      className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 outline-none dark:border-red-800 dark:bg-red-900/10 dark:text-red-300"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {errors.general}
                    </p>
                  )}
                </div>

                {formData.tipoActividad === 'programacion' && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          Repositorio plantilla de Gitea
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Cuando un alumno abra el ejercicio, se generara
                          automaticamente un repositorio privado basado en esta
                          plantilla.
                        </p>
                        {templatesOrg && (
                          <a
                            href={templatesOrg.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline dark:text-blue-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {templatesOrg.name}
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          forceRefreshRef.current = true;
                          setTemplatesReloadToken(token => token + 1);
                        }}
                        disabled={templatesLoading}
                        title="Volver a consultar las plantillas en Gitea"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-white/70 px-2.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-white disabled:opacity-60 dark:border-blue-900/60 dark:bg-slate-900/60 dark:text-blue-200 dark:hover:bg-slate-900"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${templatesLoading ? 'animate-spin' : ''}`}
                        />
                        Actualizar
                      </button>
                    </div>

                    {templatesLoading ? (
                      // Mientras cargaba, el select quedaba deshabilitado con el
                      // texto "No hay plantillas disponibles": el modal afirmaba
                      // justo lo contrario de lo que estaba por pasar.
                      <div
                        role="status"
                        className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-blue-900/60 dark:bg-slate-900/50 dark:text-slate-300"
                      >
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-300" />
                        Buscando plantillas en Gitea...
                      </div>
                    ) : templatesMessage &&
                      templates.length === 0 &&
                      !missingTemplate ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                        {templatesMessage}
                      </div>
                    ) : (
                      <div>
                        <label className="block">
                          <span className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-200">
                            Plantilla
                          </span>
                          <StyledSelect
                            value={formData.giteaTemplateRepo}
                            onChange={value =>
                              setFormData(prev => ({
                                ...prev,
                                giteaTemplateRepo: value,
                              }))
                            }
                            placeholder={
                              templates.length
                                ? 'Seleccionar plantilla'
                                : 'No hay plantillas disponibles'
                            }
                            options={[
                              ...(formData.giteaTemplateRepo
                                ? [
                                    {
                                      value: '',
                                      label: 'Sin plantilla',
                                      description:
                                        'No generar un repositorio automáticamente',
                                    },
                                  ]
                                : []),
                              ...templates.map(template => ({
                                value: template.name,
                                label: template.name,
                                description: template.full_name,
                                badge: template.private ? 'Privada' : 'Pública',
                              })),
                              // La plantilla guardada en el ejercicio puede no
                              // estar en el listado (renombrada o eliminada en
                              // Gitea). Sin esta entrada el select mostraba el
                              // placeholder y parecia que no habia ninguna
                              // configurada.
                              ...(missingTemplate
                                ? [
                                    {
                                      value: missingTemplate,
                                      label: missingTemplate,
                                      description:
                                        'Configurada en el ejercicio, no aparece hoy en la organización',
                                      badge: 'Sin verificar',
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </label>

                        {missingTemplate && (
                          <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                            La plantilla «{missingTemplate}» no figura entre las
                            de la organización. Revisá que siga existiendo antes
                            de guardar.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {formData.tipoActividad === 'programacion' &&
                  formData.giteaTemplateRepo && (
                    <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/60 dark:bg-violet-950/25">
                      <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-white">
                        Modalidad de asignación
                      </h3>
                      <StyledSelect
                        value={formData.assignmentMode}
                        onChange={value =>
                          setFormData(prev => ({
                            ...prev,
                            assignmentMode: value as 'individual' | 'group',
                          }))
                        }
                        placeholder="Seleccionar modalidad"
                        accent="violet"
                        options={[
                          {
                            value: 'individual',
                            label: 'Individual',
                            description:
                              'Un repositorio privado por estudiante',
                          },
                          {
                            value: 'group',
                            label: 'Grupal',
                            description: 'Un repositorio compartido por grupo',
                          },
                        ]}
                      />
                      {formData.assignmentMode === 'group' && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            Mínimo
                            <input
                              type="number"
                              min="1"
                              name="minGroupSize"
                              value={formData.minGroupSize}
                              data-error={errors.groupSize ? 'true' : undefined}
                              aria-invalid={!!errors.groupSize}
                              onChange={event =>
                                setFormData(prev => ({
                                  ...prev,
                                  minGroupSize: Number(event.target.value),
                                }))
                              }
                              className={`mt-1 w-full rounded-lg border bg-white p-2 text-slate-900 dark:bg-slate-800 dark:text-slate-100 ${
                                errors.groupSize
                                  ? 'border-red-500'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            />
                          </label>
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            Máximo
                            <input
                              type="number"
                              min="1"
                              name="maxGroupSize"
                              value={formData.maxGroupSize}
                              aria-invalid={!!errors.groupSize}
                              onChange={event =>
                                setFormData(prev => ({
                                  ...prev,
                                  maxGroupSize: Number(event.target.value),
                                }))
                              }
                              className={`mt-1 w-full rounded-lg border bg-white p-2 text-slate-900 dark:bg-slate-800 dark:text-slate-100 ${
                                errors.groupSize
                                  ? 'border-red-500'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            />
                          </label>
                          {errors.groupSize && (
                            <p className="-mt-1 text-sm text-red-500 sm:col-span-2">
                              {errors.groupSize}
                            </p>
                          )}
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 sm:col-span-2">
                            Cierre de modificaciones
                            <input
                              type="datetime-local"
                              name="groupsLockedAt"
                              value={formData.groupsLockedAt}
                              onChange={handleChange}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]"
                            />
                          </label>
                          <label className="group relative flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            <input
                              type="checkbox"
                              checked={formData.allowStudentGroupCreation}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  allowStudentGroupCreation: e.target.checked,
                                }))
                              }
                              className="peer absolute left-0 h-5 w-5 cursor-pointer opacity-0"
                            />
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-500 bg-white text-transparent transition peer-checked:border-violet-600 peer-checked:bg-violet-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500 peer-focus-visible:ring-offset-2 dark:border-slate-400 dark:bg-slate-900 dark:peer-checked:border-violet-400 dark:peer-checked:bg-violet-500 dark:peer-checked:text-white dark:peer-focus-visible:ring-offset-slate-950">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                            Permitir crear grupos
                          </label>
                          <label className="group relative flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            <input
                              type="checkbox"
                              checked={
                                formData.allowLeaveAfterRepositoryCreation
                              }
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  allowLeaveAfterRepositoryCreation:
                                    e.target.checked,
                                }))
                              }
                              className="peer absolute left-0 h-5 w-5 cursor-pointer opacity-0"
                            />
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-500 bg-white text-transparent transition peer-checked:border-violet-600 peer-checked:bg-violet-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500 peer-focus-visible:ring-offset-2 dark:border-slate-400 dark:bg-slate-900 dark:peer-checked:border-violet-400 dark:peer-checked:bg-violet-500 dark:peer-checked:text-white dark:peer-focus-visible:ring-offset-slate-950">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                            Permitir salir luego de crear el repo
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                {(formData.tipoActividad === 'enlace' ||
                  formData.tipoActividad === 'archivo') && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <div className="mb-4 flex items-start gap-3">
                      <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                        {formData.tipoActividad === 'archivo' ? (
                          <Table2 className="h-5 w-5" />
                        ) : (
                          <ExternalLink className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {formData.tipoActividad === 'archivo'
                            ? 'Recurso compartido'
                            : 'Enlace externo'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Para planillas, documentos, formularios, sitios
                          externos o actividades que no generan repositorio por
                          alumno.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                          Tipo de recurso
                        </span>
                        <select
                          name="recursoTipo"
                          value={formData.recursoTipo}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white"
                        >
                          {resourceTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                          Texto del boton
                        </span>
                        <input
                          type="text"
                          name="recursoTitulo"
                          value={formData.recursoTitulo}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white"
                          placeholder="Ej: Abrir planilla"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                          Enlace del recurso{' '}
                          <span className="text-red-500">*</span>
                        </span>
                        <input
                          type="url"
                          name="recursoUrl"
                          value={formData.recursoUrl}
                          onChange={handleChange}
                          data-error={errors.recursoUrl ? 'true' : undefined}
                          aria-invalid={!!errors.recursoUrl}
                          className={`w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800/50 dark:text-white ${
                            errors.recursoUrl
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                              : 'border-gray-200 dark:border-slate-600'
                          }`}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                        />
                        {errors.recursoUrl && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.recursoUrl}
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {formData.tipoActividad === 'instrucciones' && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <div className="mb-4 flex items-start gap-3">
                      <span className="rounded-xl bg-sky-100 p-2 text-sky-700 dark:bg-sky-950/50 dark:text-sky-200">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          Consigna sin repositorio
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          La descripcion funciona como consigna principal.
                          Opcionalmente podes agregar un enlace con mas detalle.
                        </p>
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Enlace de instrucciones opcional
                      </span>
                      <input
                        type="url"
                        id="readmeUrl"
                        name="readmeUrl"
                        value={formData.readmeUrl}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white"
                        placeholder="https://..."
                      />
                    </label>
                  </div>
                )}

                {/* Grid para campos opcionales */}
                {formData.tipoActividad === 'programacion' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Repositorio de Ejemplo */}
                    <div>
                      <label
                        htmlFor="repositorioEjemplo"
                        className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
                      >
                        Repositorio de Ejemplo
                      </label>
                      <input
                        type="url"
                        id="repositorioEjemplo"
                        name="repositorioEjemplo"
                        value={formData.repositorioEjemplo}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white text-sm"
                        placeholder="http://gitea-unahur.duckdns.org/profesor/ejemplo"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
                        Enlace a un repositorio de ejemplo resuelto
                      </p>
                    </div>

                    {/* README URL */}
                    <div>
                      <label
                        htmlFor="readmeUrl"
                        className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
                      >
                        README / Instrucciones
                      </label>
                      <input
                        type="url"
                        id="readmeUrl"
                        name="readmeUrl"
                        value={formData.readmeUrl}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white text-sm"
                        placeholder="http://gitea-unahur.duckdns.org/.../README.md"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
                        Enlace al archivo con instrucciones detalladas
                      </p>
                    </div>

                    {/* Fecha de Entrega */}
                    <div>
                      <label
                        htmlFor="fechaEntrega"
                        className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
                      >
                        Fecha de entrega
                      </label>
                      <input
                        type="date"
                        id="fechaEntrega"
                        name="fechaEntrega"
                        value={formData.fechaEntrega}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white dark:[color-scheme:dark] text-sm ${
                          errors.fechaEntrega
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                            : 'border-gray-200 dark:border-slate-600'
                        }`}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
                        Fecha límite para entregar el ejercicio
                      </p>
                    </div>
                  </div>
                )}

                {formData.tipoActividad !== 'programacion' && (
                  <div className="max-w-md">
                    <label
                      htmlFor="fechaEntrega"
                      className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
                    >
                      Fecha de entrega
                    </label>
                    <input
                      type="date"
                      id="fechaEntrega"
                      name="fechaEntrega"
                      value={formData.fechaEntrega}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white dark:[color-scheme:dark] text-sm ${
                        errors.fechaEntrega
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                          : 'border-gray-200 dark:border-slate-600'
                      }`}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
                      Opcional. Si tiene fecha, aparece como entrega a seguir.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-600 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    type="button"
                    disabled={loading}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-6 py-2.5 font-semibold text-slate-700 transition-all hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:w-auto"
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
                          className="h-4 w-4 animate-spin text-slate-950"
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
                      'Actualizar Ejercicio'
                    ) : (
                      'Crear Ejercicio'
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

export default EjercicioFormModal;
