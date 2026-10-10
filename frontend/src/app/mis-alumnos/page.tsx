import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useId,
} from 'react';
import { useParams } from 'react-router-dom';
import {
  usuarioService,
  AlumnoMateria,
  AlumnoDisponibleResumen,
} from '../../services/usuario.service';
import {
  cursadaService,
  comisionService,
  Comision,
  Cursada,
} from '../../services';
import { useToast } from '../../hooks';
import { usePermissions } from '../../hooks/usePermissions';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../shared/design-system/components/Button';
import { Card } from '../../shared/design-system/components/Card';
import { Badge } from '../../shared/design-system/components/Badge';
import {
  Users,
  CheckCircle,
  XCircle,
  Mail,
  Clock,
  Trash2,
  Edit2,
  Github,
  UserPlus,
  Sparkles,
  FileSpreadsheet,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Download,
} from 'lucide-react';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImportMateriaStudentsModal } from '../../components/ImportMateriaStudentsModal';

const ALUMNOS_POR_PAGINA = 12;

type SelectOption = {
  value: string | number;
  label: string;
};

type StyledSelectProps = {
  label: string;
  value?: string | number | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  compact?: boolean;
  containerClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onClose?: () => void;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

const StyledSelect: React.FC<StyledSelectProps> = ({
  label,
  value,
  options,
  onChange,
  compact = false,
  containerClassName = '',
  disabled = false,
  autoFocus = false,
  onClose,
  onClick,
}) => {
  const [open, setOpen] = useState(autoFocus);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex(option => String(option.value) === String(value ?? ''))
  );
  const selectedOption = options.find(
    option => String(option.value) === String(value ?? '')
  );

  const closeMenu = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (autoFocus) {
      triggerRef.current?.focus();
      setActiveIndex(selectedIndex);
      setOpen(true);
    }
  }, [autoFocus, selectedIndex]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, closeMenu]);

  const selectOption = (option: SelectOption) => {
    onChange(String(option.value));
    closeMenu();
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) return;

    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(
        index => (index + direction + options.length) % options.length
      );
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      selectOption(options[activeIndex]);
      return;
    }
    if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    }
    if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`group relative min-w-0 ${containerClassName}`}
      onClick={onClick}
    >
      {!compact && (
        <span className="mb-1.5 block truncate px-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 transition-colors group-focus-within:text-emerald-700 dark:text-slate-400 dark:group-focus-within:text-emerald-300">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeMenu();
            return;
          }
          setActiveIndex(selectedIndex);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={`flex w-full items-center justify-between gap-3 border border-slate-300 bg-white text-left font-bold text-slate-900 shadow-sm outline-none transition-all hover:border-emerald-400 hover:shadow-md focus:border-emerald-500 focus:ring-4 focus:ring-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-900/90 dark:text-white dark:hover:border-emerald-300/70 dark:focus:border-emerald-300 ${
          compact
            ? 'min-h-9 rounded-xl py-2 pl-3 pr-2 text-sm'
            : 'h-12 rounded-xl py-3 pl-4 pr-3 text-sm'
        } ${open ? 'border-emerald-500 ring-4 ring-emerald-300/15 dark:border-emerald-300' : ''}`}
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label || 'Seleccionar'}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-[calc(100%+0.45rem)] z-[80] max-h-72 min-w-full w-max max-w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/25 dark:border-white/15 dark:bg-slate-900"
        >
          {options.map((option, index) => {
            const selected = String(option.value) === String(value ?? '');
            const active = index === activeIndex;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold outline-none transition-colors ${
                  selected
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-100'
                    : active
                      ? 'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selected && <CheckCircle className="h-3.5 w-3.5" />}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const normalizarBusqueda = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const MisAlumnosPage: React.FC = () => {
  const { id: materiaId } = useParams<{ id: string }>();
  const toast = useToast();
  const { isAdmin, canManageCurrentMateria } = usePermissions();
  const canManageStudents = canManageCurrentMateria;

  const [solicitudesPendientes, setSolicitudesPendientes] = useState<
    AlumnoMateria[]
  >([]);
  const [alumnosAprobados, setAlumnosAprobados] = useState<AlumnoMateria[]>([]);
  const [cursadas, setCursadas] = useState<Cursada[]>([]);
  const [selectedCursadaId, setSelectedCursadaId] = useState<number | null>(
    null
  );
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<
    AlumnoDisponibleResumen[]
  >([]);
  const [alumnosDisponiblesQueryKey, setAlumnosDisponiblesQueryKey] = useState<
    string | null
  >(null);
  const [alumnosDisponiblesTotal, setAlumnosDisponiblesTotal] = useState(0);
  const [loadingAlumnosDisponibles, setLoadingAlumnosDisponibles] =
    useState(false);
  const [errorAlumnosDisponibles, setErrorAlumnosDisponibles] = useState<
    string | null
  >(null);
  const [alumnoAAsignarId, setAlumnoAAsignarId] = useState<number | null>(null);
  const [alumnoBusqueda, setAlumnoBusqueda] = useState('');
  const [alumnoBuscadorAbierto, setAlumnoBuscadorAbierto] = useState(false);
  const alumnoBuscadorRef = useRef<HTMLDivElement>(null);
  const [comisionAAsignarId, setComisionAAsignarId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [comisionFiltro, setComisionFiltro] = useState<number | null>(null);
  const [busquedaInscripto, setBusquedaInscripto] = useState('');
  const [paginaAlumnos, setPaginaAlumnos] = useState(1);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [editandoComision, setEditandoComision] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [sincronizandoGitea, setSincronizandoGitea] = useState(false);
  const [exportando, setExportando] = useState<'csv' | 'xlsx' | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const materiaInicialCargadaRef = useRef<string | null>(null);
  const alumnosDisponiblesRequestRef = useRef(0);
  const alumnosDisponiblesLoadingKeyRef = useRef<string | null>(null);

  const handleExportarAlumnos = async (format: 'csv' | 'xlsx') => {
    const parsedMateriaId = Number(materiaId);
    if (!parsedMateriaId || !selectedCursadaId) {
      toast.error('Selecciona una cursada para exportar');
      return;
    }

    setExportMenuOpen(false);
    setExportando(format);
    try {
      const blob = await usuarioService.descargarAlumnosMateria(
        parsedMateriaId,
        selectedCursadaId,
        format,
        comisionFiltro
      );
      const scope = comisionFiltro
        ? `comision-${comisionFiltro}`
        : 'todas-las-comisiones';
      const filename = `alumnos-cursada-${selectedCursadaId}-${scope}.${format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(
        `Listado ${comisionFiltro ? 'de la comisión seleccionada' : 'de todas las comisiones'} descargado`
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'No se pudo descargar el listado'
      );
    } finally {
      setExportando(null);
    }
  };

  // Estado para confirmaciones
  const [confirmacion, setConfirmacion] = useState<{
    isOpen: boolean;
    tipo: 'individual' | 'todos' | 'todos_final' | null;
    id?: number;
  }>({ isOpen: false, tipo: null });

  useEffect(() => {
    if (!alumnoBuscadorAbierto) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        alumnoBuscadorRef.current &&
        !alumnoBuscadorRef.current.contains(event.target as Node)
      ) {
        setAlumnoBuscadorAbierto(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAlumnoBuscadorAbierto(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [alumnoBuscadorAbierto]);

  useEffect(() => {
    if (!exportMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExportMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exportMenuOpen]);

  const cargarDatos = useCallback(
    async (cursadaId?: number | null) => {
      if (!materiaId) return;

      setLoading(true);
      try {
        const [pendientes, cursadasData] = await Promise.all([
          usuarioService.obtenerSolicitudesMateria(parseInt(materiaId)),
          cursadaService.getByMateria(parseInt(materiaId)),
        ]);

        setCursadas(cursadasData);
        const cursadaSeleccionada =
          cursadaId ||
          cursadasData.find(c => c.activa)?.id ||
          cursadasData[0]?.id ||
          null;

        setSelectedCursadaId(cursadaSeleccionada);

        setSolicitudesPendientes(pendientes);

        if (cursadaSeleccionada) {
          const [aprobados, comisionesData] = await Promise.all([
            usuarioService.obtenerAlumnosMateria(
              parseInt(materiaId),
              cursadaSeleccionada
            ),
            comisionService.getByCursada(cursadaSeleccionada),
          ]);
          setAlumnosAprobados(aprobados);
          setComisiones(comisionesData);
          setComisionAAsignarId(prev => prev || comisionesData[0]?.id || null);
        } else {
          setAlumnosAprobados([]);
          setComisiones([]);
          setComisionAAsignarId(null);
        }

        // Esta lista es la consulta mas costosa y solo se necesita al abrir
        // el buscador. Invalidarla evita bloquear la carga principal y hace
        // que se refresque despues de aprobar, quitar o asignar un alumno.
        alumnosDisponiblesRequestRef.current += 1;
        alumnosDisponiblesLoadingKeyRef.current = null;
        setAlumnosDisponibles([]);
        setAlumnosDisponiblesQueryKey(null);
        setAlumnosDisponiblesTotal(0);
        setLoadingAlumnosDisponibles(false);
        setErrorAlumnosDisponibles(null);
        setAlumnoAAsignarId(null);
        setAlumnoBusqueda('');
      } catch (error: any) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    },
    [materiaId, toast]
  );

  useEffect(() => {
    if (
      canManageStudents &&
      materiaId &&
      materiaInicialCargadaRef.current !== materiaId
    ) {
      materiaInicialCargadaRef.current = materiaId;
      void cargarDatos();
    }
  }, [canManageStudents, materiaId, cargarDatos]);

  const cargarAlumnosDisponibles = useCallback(
    async (force = false, search = '') => {
      if (!materiaId || !selectedCursadaId) return;
      const normalizedSearch = search.trim();
      const queryKey = `${selectedCursadaId}:${normalizedSearch.toLowerCase()}`;
      if (!force && alumnosDisponiblesQueryKey === queryKey) return;
      if (alumnosDisponiblesLoadingKeyRef.current === queryKey) return;

      const requestId = ++alumnosDisponiblesRequestRef.current;
      alumnosDisponiblesLoadingKeyRef.current = queryKey;
      setLoadingAlumnosDisponibles(true);
      setErrorAlumnosDisponibles(null);

      try {
        const response = await usuarioService.obtenerAlumnosDisponiblesCursada(
          parseInt(materiaId),
          selectedCursadaId,
          normalizedSearch,
          1,
          40
        );
        if (requestId !== alumnosDisponiblesRequestRef.current) return;

        setAlumnosDisponibles(response.items);
        setAlumnosDisponiblesTotal(response.total);
        setAlumnosDisponiblesQueryKey(queryKey);
      } catch (error) {
        if (requestId !== alumnosDisponiblesRequestRef.current) return;
        console.error('Error al cargar alumnos disponibles:', error);
        setErrorAlumnosDisponibles('No se pudo cargar la lista de alumnos');
      } finally {
        if (requestId === alumnosDisponiblesRequestRef.current) {
          alumnosDisponiblesLoadingKeyRef.current = null;
          setLoadingAlumnosDisponibles(false);
        }
      }
    },
    [materiaId, selectedCursadaId, alumnosDisponiblesQueryKey]
  );

  useEffect(() => {
    if (!alumnoBuscadorAbierto || !selectedCursadaId) return;
    const timer = window.setTimeout(
      () => void cargarAlumnosDisponibles(false, alumnoBusqueda),
      alumnoBusqueda.trim() ? 250 : 0
    );
    return () => window.clearTimeout(timer);
  }, [
    alumnoBuscadorAbierto,
    alumnoBusqueda,
    selectedCursadaId,
    cargarAlumnosDisponibles,
  ]);

  const handleAprobar = async (solicitudId: number) => {
    setProcesando(solicitudId);
    try {
      await usuarioService.aprobarSolicitud(solicitudId, {});
      toast.success('Solicitud aprobada exitosamente');
      await cargarDatos(selectedCursadaId);
    } catch (error: any) {
      console.error('Error al aprobar:', error);
      toast.error(
        error.response?.data?.message || 'Error al aprobar la solicitud'
      );
    } finally {
      setProcesando(null);
    }
  };

  const handleRechazar = async (solicitudId: number) => {
    const mensaje = prompt(
      'Mensaje opcional para el alumno (motivo del rechazo):'
    );

    setProcesando(solicitudId);
    try {
      await usuarioService.rechazarSolicitud(solicitudId, {
        mensaje: mensaje || undefined,
      });
      toast.success('Solicitud rechazada');
      await cargarDatos(selectedCursadaId);
    } catch (error: any) {
      console.error('Error al rechazar:', error);
      toast.error(
        error.response?.data?.message || 'Error al rechazar la solicitud'
      );
    } finally {
      setProcesando(null);
    }
  };

  const iniciarEliminacionAlumno = (inscripcionId: number) => {
    setConfirmacion({
      isOpen: true,
      tipo: 'individual',
      id: inscripcionId,
    });
  };

  const iniciarEliminacionTodos = () => {
    setConfirmacion({
      isOpen: true,
      tipo: 'todos',
    });
  };

  const confirmarAccion = async () => {
    if (!confirmacion.tipo) return;

    // Logica para eliminacion individual
    if (confirmacion.tipo === 'individual' && confirmacion.id) {
      const id = confirmacion.id;
      setConfirmacion({ isOpen: false, tipo: null });
      setProcesando(id);
      try {
        await usuarioService.eliminarAlumnoMateria(id);
        toast.success('Alumno eliminado exitosamente');
        await cargarDatos(selectedCursadaId);
      } catch (error: any) {
        console.error('Error al eliminar alumno:', error);
        toast.error(
          error.response?.data?.message || 'Error al eliminar al alumno'
        );
      } finally {
        setProcesando(null);
      }
      return;
    }

    // Logica para eliminacion de todos (Paso 1)
    if (confirmacion.tipo === 'todos') {
      setConfirmacion({
        isOpen: true,
        tipo: 'todos_final',
      });
      return;
    }

    // Logica para eliminacion de todos (Paso 2 - Final)
    if (confirmacion.tipo === 'todos_final' && materiaId) {
      setConfirmacion({ isOpen: false, tipo: null });
      setLoading(true);
      try {
        await usuarioService.eliminarTodosAlumnosMateria(
          parseInt(materiaId),
          selectedCursadaId || undefined
        );
        toast.success('Todos los alumnos han sido eliminados');
        await cargarDatos(selectedCursadaId);
      } catch (error: any) {
        console.error('Error al eliminar todos los alumnos:', error);
        toast.error(
          error.response?.data?.message || 'Error al eliminar los alumnos'
        );
        setLoading(false);
      }
    }
  };

  const cancelarConfirmacion = () => {
    setConfirmacion({ isOpen: false, tipo: null });
  };

  const handleCambiarComision = async (
    inscripcionId: number,
    nuevaComisionId: number
  ) => {
    setProcesando(inscripcionId);
    try {
      await usuarioService.actualizarComisionAlumno(
        inscripcionId,
        nuevaComisionId
      );
      toast.success('Comision actualizada exitosamente');
      await cargarDatos(selectedCursadaId);
      setEditandoComision(null);
    } catch (error: any) {
      console.error('Error al cambiar comision:', error);
      toast.error(
        error.response?.data?.message || 'Error al cambiar la comision'
      );
    } finally {
      setProcesando(null);
    }
  };

  const handleAsignarAlumno = async () => {
    if (!materiaId || !alumnoAAsignarId || !comisionAAsignarId) {
      toast.error('Selecciona un alumno y una comision');
      return;
    }

    setProcesando(alumnoAAsignarId);
    try {
      await usuarioService.asignarAlumnoACursada(
        parseInt(materiaId),
        alumnoAAsignarId,
        comisionAAsignarId
      );
      toast.success('Acceso otorgado exitosamente');
      setAlumnoAAsignarId(null);
      setAlumnoBusqueda('');
      setAlumnoBuscadorAbierto(false);
      await cargarDatos(selectedCursadaId);
    } catch (error: any) {
      console.error('Error al asignar alumno:', error);
      toast.error(
        error.response?.data?.message || 'Error al otorgar acceso al alumno'
      );
    } finally {
      setProcesando(null);
    }
  };

  const handleSincronizarGitea = async () => {
    if (!materiaId) return;

    setSincronizandoGitea(true);
    try {
      const result = await usuarioService.sincronizarAlumnosGitea(
        parseInt(materiaId)
      );
      if (result.skipped) {
        toast.success('La sincronizacion ya esta en curso en otra replica');
        return;
      }
      await cargarDatos(selectedCursadaId);
      toast.success(
        `Gitea sincronizado: ${result.created} nuevos y ${result.updated} actualizados`
      );
    } catch (error: any) {
      console.error('Error al sincronizar alumnos de Gitea:', error);
      toast.error(
        error.response?.data?.message ||
          'No se pudieron sincronizar los alumnos de Gitea'
      );
    } finally {
      setSincronizandoGitea(false);
    }
  };

  // Obtener comisiones unicas
  const comisionesUnicas = Array.from(
    new Set(alumnosAprobados.map(a => a.comision?.id).filter(Boolean))
  )
    .map(id => alumnosAprobados.find(a => a.comision?.id === id)?.comision)
    .filter(Boolean);

  // Filtrar alumnos por comision y datos personales
  const alumnosFiltrados = useMemo(() => {
    const query = normalizarBusqueda(busquedaInscripto);

    return alumnosAprobados.filter(inscripcion => {
      if (comisionFiltro && inscripcion.comision?.id !== comisionFiltro) {
        return false;
      }

      if (!query) return true;

      const alumno = inscripcion.alumno;
      return normalizarBusqueda(
        [
          alumno?.githubUser,
          alumno?.nombre,
          alumno?.apellido,
          alumno?.email,
          `${alumno?.nombre || ''} ${alumno?.apellido || ''}`,
          `${alumno?.apellido || ''} ${alumno?.nombre || ''}`,
        ].join(' ')
      ).includes(query);
    });
  }, [alumnosAprobados, busquedaInscripto, comisionFiltro]);

  const totalPaginasAlumnos = Math.max(
    1,
    Math.ceil(alumnosFiltrados.length / ALUMNOS_POR_PAGINA)
  );
  const alumnosPaginados = useMemo(() => {
    const inicio = (paginaAlumnos - 1) * ALUMNOS_POR_PAGINA;
    return alumnosFiltrados.slice(inicio, inicio + ALUMNOS_POR_PAGINA);
  }, [alumnosFiltrados, paginaAlumnos]);

  useEffect(() => {
    setPaginaAlumnos(current => Math.min(current, totalPaginasAlumnos));
  }, [totalPaginasAlumnos]);

  const selectedCursada = cursadas.find(c => c.id === selectedCursadaId);
  const alumnoSeleccionado = alumnosDisponibles.find(
    alumno => alumno.id === alumnoAAsignarId
  );
  const formatAlumnoLabel = (alumno: AlumnoDisponibleResumen) =>
    [alumno.apellido, alumno.nombre].filter(Boolean).join(' ') ||
    alumno.email ||
    alumno.githubUser ||
    'Alumno sin nombre';
  const alumnosDisponiblesFiltrados = alumnosDisponibles;

  if (!canManageStudents) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <Card className="border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-slate-950/40">
          <p className="text-slate-700 dark:text-slate-200">
            Esta pagina es solo para profesores y administradores
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="materia-page-shell">
      <div className="materia-page-gradient" />
      <div className="materia-page-grid" />
      {/* Hero Header */}
      <section className="materia-hero">
        <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="materia-chip-primary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black uppercase tracking-wide shadow-lg">
                <Sparkles className="h-4 w-4" />
                Aula digital ITI
              </span>
              <span className="materia-chip-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black">
                <Users className="h-4 w-4" />
                Gestion de estudiantes
              </span>
            </div>
            <h1 className="materia-hero-title max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
              {isAdmin ? 'Alumnos de la Materia' : 'Mis Alumnos'}
            </h1>
            <p className="materia-hero-description mt-4 max-w-3xl text-lg font-medium leading-8">
              Gestiona las solicitudes y visualiza los alumnos inscritos
            </p>
          </div>
        </div>
      </section>

      <div className="container relative z-10 mx-auto px-4 py-8">
        {selectedCursadaId && (
          <Card className="relative z-[80] mb-8 overflow-visible border-white/10 bg-white/[0.96] p-5 shadow-2xl shadow-slate-950/15 backdrop-blur dark:bg-slate-900/90">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    <UserPlus className="h-4 w-4" />
                    Otorgar acceso a cursada
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    disabled={comisiones.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-lg shadow-slate-950/20 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Alta masiva por Excel
                  </button>
                  <button
                    type="button"
                    onClick={handleSincronizarGitea}
                    disabled={sincronizandoGitea}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${sincronizandoGitea ? 'animate-spin' : ''}`}
                    />
                    {sincronizandoGitea
                      ? 'Sincronizando...'
                      : 'Sincronizar Gitea'}
                  </button>
                </div>
                <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                  {selectedCursada?.titulo || 'Cursada seleccionada'}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Asigna un alumno existente a una comision de esta cursada.
                </p>
              </div>

              <div className="grid w-full items-end gap-3 sm:grid-cols-2 lg:min-w-[680px] lg:grid-cols-[minmax(320px,1fr)_180px_auto]">
                <div
                  ref={alumnoBuscadorRef}
                  className="relative sm:col-span-2 lg:col-span-1"
                  onKeyDown={event => {
                    if (event.key === 'Escape') setAlumnoBuscadorAbierto(false);
                  }}
                >
                  <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    value={
                      alumnoBuscadorAbierto
                        ? alumnoBusqueda
                        : alumnoSeleccionado
                          ? formatAlumnoLabel(alumnoSeleccionado)
                          : alumnoBusqueda
                    }
                    onFocus={() => {
                      setAlumnoBuscadorAbierto(true);
                      if (alumnoSeleccionado && !alumnoBusqueda) {
                        setAlumnoBusqueda('');
                      }
                    }}
                    onChange={e => {
                      setAlumnoBusqueda(e.target.value);
                      setAlumnoAAsignarId(null);
                      setAlumnoBuscadorAbierto(true);
                    }}
                    disabled={!selectedCursadaId}
                    placeholder={
                      loadingAlumnosDisponibles
                        ? 'Cargando alumnos disponibles...'
                        : alumnosDisponiblesQueryKey ===
                              `${selectedCursadaId}:` &&
                            alumnosDisponibles.length === 0
                          ? 'No hay alumnos disponibles'
                          : 'Buscar alumno por nombre, email o Gitea'
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm font-black leading-none text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/45 dark:text-white dark:placeholder:text-slate-400"
                  />
                  {alumnoAAsignarId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAlumnoAAsignarId(null);
                        setAlumnoBusqueda('');
                        setAlumnoBuscadorAbierto(true);
                      }}
                      className="absolute right-3 top-1/2 z-10 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                      aria-label="Limpiar alumno seleccionado"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  )}

                  {alumnoBuscadorAbierto && (
                    <div className="absolute left-0 right-0 top-full z-[999] mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-950 dark:shadow-slate-950/60">
                      <div className="mb-1 flex items-center justify-between px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <span>Alumnos de Gitea</span>
                        <div className="flex items-center gap-2">
                          <span>
                            {loadingAlumnosDisponibles
                              ? 'Cargando'
                              : `${alumnosDisponiblesFiltrados.length}/${alumnosDisponiblesTotal}`}
                          </span>
                          <button
                            type="button"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => setAlumnoBuscadorAbierto(false)}
                            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                            aria-label="Cerrar lista de alumnos"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {loadingAlumnosDisponibles ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Cargando alumnos disponibles...
                        </div>
                      ) : errorAlumnosDisponibles ? (
                        <div className="px-4 py-4 text-center">
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {errorAlumnosDisponibles}
                          </p>
                          <button
                            type="button"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => {
                              void cargarAlumnosDisponibles(
                                true,
                                alumnoBusqueda
                              );
                            }}
                            className="mt-2 text-sm font-black text-emerald-700 hover:underline dark:text-emerald-300"
                          >
                            Intentar de nuevo
                          </button>
                        </div>
                      ) : alumnosDisponiblesFiltrados.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
                          No se encontraron alumnos con esa busqueda.
                        </div>
                      ) : (
                        alumnosDisponiblesFiltrados.map(alumno => (
                          <button
                            key={alumno.id}
                            type="button"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => {
                              setAlumnoAAsignarId(alumno.id);
                              setAlumnoBusqueda('');
                              setAlumnoBuscadorAbierto(false);
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                              alumno.id === alumnoAAsignarId
                                ? 'bg-emerald-50 ring-2 ring-emerald-300 dark:bg-emerald-400/10 dark:ring-emerald-300/50'
                                : 'hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/10">
                              {(
                                alumno.nombre ||
                                alumno.apellido ||
                                alumno.email ||
                                '?'
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-black text-slate-950 dark:text-white">
                                {formatAlumnoLabel(alumno)}
                              </div>
                              <div className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {alumno.email}
                              </div>
                              {alumno.githubUser && (
                                <div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  <Github className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {alumno.githubUser}
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <StyledSelect
                  label="Comisión"
                  value={comisionAAsignarId || ''}
                  onChange={value =>
                    setComisionAAsignarId(value ? Number(value) : null)
                  }
                  disabled={comisiones.length === 0}
                  options={[
                    { value: '', label: 'Seleccionar comisión' },
                    ...comisiones.map(comision => ({
                      value: comision.id,
                      label: comision.nombre,
                    })),
                  ]}
                />

                <Button
                  variant="primary"
                  onClick={handleAsignarAlumno}
                  disabled={
                    !alumnoAAsignarId ||
                    !comisionAAsignarId ||
                    procesando === alumnoAAsignarId
                  }
                  className="h-12 w-full justify-center self-end rounded-xl border-none bg-emerald-400 font-black text-slate-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-300 dark:text-white lg:w-auto"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Dar acceso
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Solicitudes Pendientes */}
        {solicitudesPendientes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-6 w-6 text-amber-500 dark:text-amber-300" />
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                Solicitudes Pendientes
              </h2>
              <Badge variant="warning" size="md">
                {solicitudesPendientes.length}
              </Badge>
            </div>

            <div className="grid gap-4">
              {solicitudesPendientes.map(solicitud => (
                <Card
                  key={solicitud.id}
                  className="border-white/10 bg-white/[0.96] p-6 shadow-xl shadow-slate-950/15 transition-all hover:-translate-y-0.5 hover:shadow-2xl dark:bg-slate-900/90"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/20">
                          <span className="text-lg font-black">
                            {solicitud.alumno?.nombre?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-950 dark:text-white">
                            {solicitud.alumno?.nombre}{' '}
                            {solicitud.alumno?.apellido}
                          </h3>
                          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">
                              {solicitud.alumno?.email}
                            </span>
                          </div>
                          {solicitud.alumno?.githubUser && (
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                              <Github className="w-4 h-4" />
                              {solicitud.alumno.githubUser}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-700 dark:text-slate-300">
                            Comision:
                          </span>
                          <Badge variant="info">
                            {solicitud.comision?.nombre || 'N/A'}
                          </Badge>
                        </div>
                        <div className="font-medium text-slate-500 dark:text-slate-400">
                          Solicitado:{' '}
                          {new Date(
                            solicitud.fechaInscripcion
                          ).toLocaleDateString('es-AR', {
                            timeZone: 'America/Argentina/Buenos_Aires',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAprobar(solicitud.id)}
                        disabled={procesando === solicitud.id}
                        className="w-full justify-center rounded-xl border-none bg-emerald-500 font-bold text-slate-950 dark:text-white hover:bg-emerald-400 sm:w-auto"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRechazar(solicitud.id)}
                        disabled={procesando === solicitud.id}
                        className="w-full justify-center rounded-xl border-red-300/60 bg-white/80 font-bold text-red-600 hover:bg-red-50 dark:bg-white/10 dark:text-red-200 dark:hover:bg-red-500/10 sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Alumnos Aprobados */}
        <div>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                Alumnos Inscritos
              </h2>
              <Badge variant="info" size="md">
                {alumnosFiltrados.length}
              </Badge>
            </div>

            <div className="grid w-full grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:w-auto xl:flex xl:flex-wrap xl:items-end xl:justify-end">
              {cursadas.length > 0 && (
                <StyledSelect
                  label="Cursada"
                  value={selectedCursadaId || ''}
                  onChange={value => {
                    const nuevaCursadaId = value ? Number(value) : null;
                    setSelectedCursadaId(nuevaCursadaId);
                    setComisionFiltro(null);
                    setBusquedaInscripto('');
                    setPaginaAlumnos(1);
                    setAlumnoAAsignarId(null);
                    setComisionAAsignarId(null);
                    void cargarDatos(nuevaCursadaId);
                  }}
                  containerClassName="w-full xl:min-w-[230px] xl:w-auto"
                  options={cursadas.map(cursada => ({
                    value: cursada.id,
                    label: `${cursada.titulo}${
                      cursada.activa ? ' - Actual' : ' - Anterior'
                    }`,
                  }))}
                />
              )}

              {alumnosFiltrados.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={iniciarEliminacionTodos}
                  className="h-12 w-full justify-center rounded-xl border-red-300/70 bg-red-50 font-black text-red-700 hover:bg-red-100 dark:border-red-300/50 dark:bg-red-500/10 dark:text-red-100 dark:hover:bg-red-500/20 xl:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Todos
                </Button>
              )}

              {alumnosAprobados.length > 0 && selectedCursadaId && (
                <div
                  ref={exportMenuRef}
                  className="relative h-12 w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExportMenuOpen(open => !open)}
                    disabled={exportando !== null}
                    className="h-12 w-full justify-center rounded-xl px-4 sm:w-auto"
                    aria-haspopup="menu"
                    aria-expanded={exportMenuOpen}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {exportando
                      ? `Generando ${exportando === 'xlsx' ? 'Excel' : 'CSV'}...`
                      : 'Descargar'}
                    <ChevronDown
                      className={`ml-2 h-4 w-4 transition-transform ${
                        exportMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>

                  {exportMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/20 dark:border-white/15 dark:bg-slate-900"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleExportarAlumnos('csv')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none dark:hover:bg-white/10 dark:focus:bg-white/10"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                          <Download className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-black text-slate-900 dark:text-white">
                            CSV
                          </span>
                          <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Compatible con cualquier planilla
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleExportarAlumnos('xlsx')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none dark:hover:bg-emerald-400/10 dark:focus:bg-emerald-400/10"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                          <FileSpreadsheet className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-black text-slate-900 dark:text-white">
                            Excel
                          </span>
                          <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Archivo con formato .xlsx
                          </span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Filtro por comision */}
              {comisionesUnicas.length > 1 && (
                <div className="min-w-0">
                  <StyledSelect
                    label="Filtrar por comisión"
                    value={comisionFiltro || ''}
                    onChange={value => {
                      setComisionFiltro(value ? parseInt(value) : null);
                      setPaginaAlumnos(1);
                    }}
                    containerClassName="w-full sm:min-w-[250px]"
                    options={[
                      { value: '', label: 'Todas las comisiones' },
                      ...comisionesUnicas.map(comision => ({
                        value: comision!.id,
                        label: comision!.nombre,
                      })),
                    ]}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="relative mb-6 max-w-2xl">
            <label htmlFor="buscar-alumno-inscripto" className="sr-only">
              Buscar alumno inscripto
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              id="buscar-alumno-inscripto"
              type="search"
              value={busquedaInscripto}
              onChange={event => {
                setBusquedaInscripto(event.target.value);
                setPaginaAlumnos(1);
              }}
              placeholder="Buscar por usuario, nombre, apellido o email"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:placeholder:text-slate-400"
            />
            {busquedaInscripto && (
              <button
                type="button"
                onClick={() => {
                  setBusquedaInscripto('');
                  setPaginaAlumnos(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Limpiar busqueda de alumnos"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {alumnosFiltrados.length === 0 ? (
            <Card className="border-white/10 bg-white/[0.96] p-12 text-center shadow-2xl shadow-slate-950/15 dark:bg-slate-900/90">
              {busquedaInscripto ? (
                <Search className="mx-auto mb-4 h-16 w-16 text-emerald-300" />
              ) : (
                <Users className="mx-auto mb-4 h-16 w-16 text-emerald-300" />
              )}
              <h3 className="mb-2 text-xl font-black text-slate-950 dark:text-white">
                {busquedaInscripto
                  ? 'No se encontraron alumnos'
                  : 'No hay alumnos inscritos'}
              </h3>
              <p className="font-medium text-slate-600 dark:text-slate-400">
                {busquedaInscripto
                  ? 'Proba con otro usuario, nombre, apellido o email.'
                  : comisionFiltro
                    ? 'No hay alumnos en esta comision'
                    : 'Aun no tienes alumnos aprobados en esta materia'}
              </p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {alumnosPaginados.map(alumno => (
                  <Card
                    key={alumno.id}
                    className="border-white/10 bg-white/[0.96] p-5 shadow-xl shadow-slate-950/15 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-2xl dark:bg-slate-900/90"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-950/20">
                        <span className="text-lg font-black">
                          {alumno.alumno?.nombre?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate font-black text-slate-950 dark:text-white">
                          {alumno.alumno?.nombre} {alumno.alumno?.apellido}
                        </h3>
                        <p className="truncate text-sm font-medium text-slate-600 dark:text-slate-400">
                          {alumno.alumno?.email}
                        </p>
                        {alumno.alumno?.githubUser && (
                          <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <Github className="w-3 h-3" />
                            <span className="truncate">
                              {alumno.alumno.githubUser}
                            </span>
                          </div>
                        )}
                        <div className="mt-2 flex min-w-0 items-center gap-2">
                          {editandoComision === alumno.id ? (
                            <StyledSelect
                              label="Cambiar comisión"
                              compact
                              value={alumno.comisionId}
                              onChange={value =>
                                handleCambiarComision(
                                  alumno.id,
                                  parseInt(value)
                                )
                              }
                              disabled={procesando === alumno.id}
                              containerClassName="min-w-0 max-w-full"
                              onClose={() => setEditandoComision(null)}
                              autoFocus
                              onClick={e => e.stopPropagation()}
                              options={comisiones.map(comision => ({
                                value: comision.id,
                                label: comision.nombre,
                              }))}
                            />
                          ) : (
                            <>
                              <Badge variant="success" size="sm">
                                {alumno.comision?.nombre || 'Sin comision'}
                              </Badge>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditandoComision(alumno.id);
                                }}
                                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-emerald-300/10 hover:text-emerald-300"
                                title="Cambiar comision"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => iniciarEliminacionAlumno(alumno.id)}
                        disabled={procesando === alumno.id}
                        className="rounded-xl border border-slate-200 bg-white/90 p-2 text-red-600 shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-red-200 dark:hover:bg-red-500/10"
                        title="Eliminar alumno"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>

              {totalPaginasAlumnos > 1 && (
                <nav
                  className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/[0.96] px-4 py-3 shadow-lg shadow-slate-950/10 dark:border-white/10 dark:bg-slate-900/90 sm:flex-row"
                  aria-label="Paginacion de alumnos inscritos"
                >
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Mostrando {(paginaAlumnos - 1) * ALUMNOS_POR_PAGINA + 1}–
                    {Math.min(
                      paginaAlumnos * ALUMNOS_POR_PAGINA,
                      alumnosFiltrados.length
                    )}{' '}
                    de {alumnosFiltrados.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPaginaAlumnos(current => Math.max(1, current - 1))
                      }
                      disabled={paginaAlumnos === 1}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>
                    <span className="min-w-24 text-center text-sm font-black text-slate-700 dark:text-slate-200">
                      Pagina {paginaAlumnos} de {totalPaginasAlumnos}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaginaAlumnos(current =>
                          Math.min(totalPaginasAlumnos, current + 1)
                        )
                      }
                      disabled={paginaAlumnos === totalPaginasAlumnos}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogo de Confirmacion */}
      <ConfirmDialog
        isOpen={confirmacion.isOpen}
        title={
          confirmacion.tipo === 'individual'
            ? 'Eliminar Alumno'
            : confirmacion.tipo === 'todos'
              ? 'Eliminar Todos los Alumnos'
              : 'Confirmacion Final'
        }
        message={
          confirmacion.tipo === 'individual'
            ? 'Estas seguro de que deseas eliminar a este alumno de la materia?'
            : confirmacion.tipo === 'todos'
              ? 'Estas seguro de que deseas eliminar a TODOS los alumnos de esta materia? Esta accion no se puede deshacer.'
              : 'Confirma nuevamente que deseas eliminar a TODOS los alumnos. Esta accion es irreversible.'
        }
        confirmText={
          confirmacion.tipo === 'todos_final'
            ? 'Si, Eliminar Todos'
            : 'Eliminar'
        }
        cancelText="Cancelar"
        onConfirm={confirmarAccion}
        onCancel={cancelarConfirmacion}
        variant="danger"
      />

      {materiaId && (
        <ImportMateriaStudentsModal
          open={showImportModal}
          materiaId={parseInt(materiaId)}
          comisiones={comisiones}
          defaultComisionId={comisionAAsignarId}
          onClose={() => setShowImportModal(false)}
          onImported={cargarDatos}
        />
      )}
    </div>
  );
};

export default MisAlumnosPage;
