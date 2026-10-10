import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Calendar,
  Settings,
  ChevronDown,
  Check,
  Filter,
  StopCircle,
  Sparkles,
  Copy,
} from 'lucide-react';
import { WeekCard } from '../../modules/semanas/components/WeekCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorComponent } from '../../components/ErrorComponent';
import { Button } from '../../shared/design-system/components/Button';
import { Badge } from '../../shared/design-system/components/Badge';
import { SemanaFormModal } from '../../components/SemanaFormModal';
import { CursadaFormModal } from '../../components/CursadaFormModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MateriaAccessGuard } from '../../components/MateriaAccessGuard';
import { usePermissions, useToast, useConfirm } from '../../hooks';
import { useMateriaConfig } from '../../hooks/useMateriaConfig';
import {
  semanaService,
  Semana,
  cursadaService,
  Cursada,
  comisionService,
  Comision,
} from '../../services';
import { usuarioService } from '../../services/usuario.service';
import { useStudentPreview } from '../../contexts/StudentPreviewContext';

export const SemanasPage: React.FC = () => {
  const { id: materiaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    canCreate,
    canEdit,
    canDelete,
    isProfesor,
    isAlumno,
    canManageCurrentMateria,
    loadingPermissions,
  } = usePermissions();
  const canManageCursadas = canManageCurrentMateria || isProfesor;
  const { selection, isPreviewing } = useStudentPreview();
  const { config } = useMateriaConfig(materiaId ? Number(materiaId) : null);
  const toast = useToast();
  const { confirmState, confirm } = useConfirm();

  // Estados
  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCursadaFormOpen, setIsCursadaFormOpen] = useState(false);
  const [selectedSemana, setSelectedSemana] = useState<Semana | null>(null);
  const [cursadaActiva, setCursadaActiva] = useState<Cursada | null>(null);
  const [editingCursada, setEditingCursada] = useState<Cursada | null>(null);
  const [cursadas, setCursadas] = useState<Cursada[]>([]);
  const [loadingCursada, setLoadingCursada] = useState(true);

  // Filtrado
  const [searchParams, setSearchParams] = useSearchParams();
  const urlComisionParam = searchParams.get('comisionId');
  const [comisionFilter, setComisionFilter] = useState<number | 'todas'>(() => {
    if (urlComisionParam && !isNaN(Number(urlComisionParam))) {
      return Number(urlComisionParam);
    }
    return 'todas';
  });

  const handleComisionFilterChange = (nextFilter: number | 'todas') => {
    setComisionFilter(nextFilter);
    const newParams = new URLSearchParams(searchParams);
    if (nextFilter === 'todas') {
      newParams.delete('comisionId');
    } else {
      newParams.set('comisionId', String(nextFilter));
    }
    setSearchParams(newParams, { replace: true });
  };
  const [alumnoComisionId, setAlumnoComisionId] = useState<number | null>(null);
  const [alumnoComisionLoaded, setAlumnoComisionLoaded] = useState(false);
  const [alumnoCursadas, setAlumnoCursadas] = useState<Cursada[]>([]);
  const [alumnoComisionesPorCursada, setAlumnoComisionesPorCursada] = useState<
    Record<number, number>
  >({});
  const [comisionesDisponibles, setComisionesDisponibles] = useState<
    Comision[]
  >([]);
  const [isComisionDropdownOpen, setIsComisionDropdownOpen] = useState(false);
  const [isCursadaDropdownOpen, setIsCursadaDropdownOpen] = useState(false);

  const loadAlumnoComision = useCallback(
    (cursadaId: number | null) => {
      setAlumnoComisionId(
        cursadaId ? alumnoComisionesPorCursada[cursadaId] || null : null
      );
      setAlumnoComisionLoaded(true);
    },
    [alumnoComisionesPorCursada]
  );

  const loadComisiones = useCallback(async (cursadaId: number) => {
    try {
      const comisiones = await comisionService.getByCursada(cursadaId);
      setComisionesDisponibles(comisiones);
    } catch (err) {
      console.error('Error al cargar comisiones:', err);
    }
  }, []);

  const loadCursadas = useCallback(async () => {
    if (!materiaId) {
      setCursadas([]);
      setAlumnoCursadas([]);
      setAlumnoComisionesPorCursada({});
      setCursadaActiva(null);
      setLoadingCursada(false);
      return;
    }
    setLoadingCursada(true);
    try {
      const cursadasRequest = cursadaService.getByMateria(parseInt(materiaId));
      const inscripcionesRequest =
        isAlumno && !canManageCursadas && !isPreviewing
          ? usuarioService.obtenerMateriasAprobadas()
          : Promise.resolve([]);
      const [data, inscripciones] = await Promise.all([
        cursadasRequest,
        inscripcionesRequest,
      ]);
      setCursadas(data);

      if (
        isPreviewing &&
        selection?.materiaId === parseInt(materiaId) &&
        data.some(cursada => cursada.id === selection.cursadaId)
      ) {
        const previewCursada = data.find(
          cursada => cursada.id === selection.cursadaId
        )!;
        setAlumnoComisionesPorCursada({
          [selection.cursadaId]: selection.comisionId,
        });
        setAlumnoCursadas([previewCursada]);
        setCursadaActiva(previewCursada);
        return;
      }

      if (isAlumno && !canManageCursadas) {
        const materiaIdNumber = parseInt(materiaId);
        const comisionesPorCursada = inscripciones
          .filter(inscripcion => inscripcion.materiaId === materiaIdNumber)
          .reduce<Record<number, number>>((result, inscripcion) => {
            const cursadaId = inscripcion.comision?.cursada?.id;
            if (cursadaId) result[cursadaId] = inscripcion.comisionId;
            return result;
          }, {});
        const cursadasAprobadas = data.filter(
          cursada => comisionesPorCursada[cursada.id]
        );
        setAlumnoComisionesPorCursada(comisionesPorCursada);
        setAlumnoCursadas(cursadasAprobadas);
        setCursadaActiva(
          cursadasAprobadas.find(c => c.activa) || cursadasAprobadas[0] || null
        );
        return;
      }

      setAlumnoComisionesPorCursada({});
      setAlumnoCursadas([]);

      const activa = data.find(c => c.activa);
      if (activa) {
        setCursadaActiva(activa);
        // Las comisiones solo alimentan el filtro. No deben bloquear la carga
        // principal de semanas, que puede comenzar apenas conocemos la cursada.
        if (canManageCursadas) void loadComisiones(activa.id);
      } else if (data.length > 0) {
        if (canManageCursadas) {
          const reciente = data[0];
          setCursadaActiva(reciente);
          void loadComisiones(reciente.id);
        } else {
          setCursadaActiva(null);
        }
      } else {
        setCursadaActiva(null);
        setComisionesDisponibles([]);
      }
    } catch (err) {
      console.error('Error al cargar cursadas:', err);
      setError('Error al cargar cursadas');
    } finally {
      setLoadingCursada(false);
    }
  }, [
    materiaId,
    isAlumno,
    canManageCursadas,
    loadComisiones,
    isPreviewing,
    selection,
  ]);

  const cursadaActivaId = cursadaActiva?.id ?? null;

  const loadSemanas = useCallback(async () => {
    if (!cursadaActivaId) {
      setSemanas([]);
      setLoading(false);
      return;
    }
    if (isAlumno && !canManageCursadas && !alumnoComisionLoaded) return;

    setLoading(true);
    setError(null);
    try {
      let data: Semana[];
      if (isAlumno && !canManageCursadas && alumnoComisionId) {
        data = await semanaService.getVisiblesParaAlumno(
          cursadaActivaId,
          alumnoComisionId
        );
      } else if (canManageCursadas && comisionFilter !== 'todas') {
        data = await semanaService.getByComision(comisionFilter as number);
      } else {
        data = await semanaService.getByCursada(cursadaActivaId);
      }
      const uniqueData = Array.from(
        new Map(data.map(item => [item.id, item])).values()
      );
      setSemanas(uniqueData);
    } catch (err: any) {
      console.error('Error al cargar semanas:', err);
      setError(err.message || 'Error al cargar las semanas');
    } finally {
      setLoading(false);
    }
  }, [
    cursadaActivaId,
    comisionFilter,
    alumnoComisionId,
    alumnoComisionLoaded,
    isAlumno,
    canManageCursadas,
  ]);

  useEffect(() => {
    if (loadingPermissions) return;
    loadCursadas();
  }, [
    materiaId,
    isAlumno,
    canManageCursadas,
    loadingPermissions,
    loadCursadas,
  ]);

  useEffect(() => {
    if (loadingPermissions || loadingCursada) return;
    if (isAlumno && !canManageCursadas && materiaId) {
      loadAlumnoComision(cursadaActivaId);
    } else {
      setAlumnoComisionId(null);
      setAlumnoComisionLoaded(true);
    }
  }, [
    materiaId,
    isAlumno,
    canManageCursadas,
    loadingPermissions,
    loadingCursada,
    cursadaActivaId,
    loadAlumnoComision,
  ]);

  useEffect(() => {
    if (
      cursadaActivaId &&
      (!isAlumno || canManageCursadas || alumnoComisionLoaded)
    ) {
      loadSemanas();
    }
  }, [
    cursadaActivaId,
    isAlumno,
    canManageCursadas,
    alumnoComisionLoaded,
    loadSemanas,
  ]);

  const handleCreate = () => {
    if (!cursadaActiva || !cursadaActiva.activa) {
      toast.error(
        'No hay una cursada activa. Por favor, inicia una cursada primero.'
      );
      return;
    }
    setSelectedSemana(null);
    setIsFormOpen(true);
  };

  const handleEdit = async (semana: Semana, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // La lista usa un resumen liviano. Cargar el detalle solo al editar evita
      // perder avisos o bloques de contenido que no forman parte del resumen.
      const detalle = await semanaService.getById(semana.id);
      setSelectedSemana(detalle);
      setIsFormOpen(true);
    } catch (err: any) {
      console.error('Error al cargar el detalle de la semana:', err);
      toast.error(
        err.response?.data?.message ||
          'No se pudo cargar la semana para editarla'
      );
    }
  };

  const handleDelete = async (semana: Semana, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Eliminar Semana',
      message: `¿Estás seguro de que deseas eliminar "${semana.titulo}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      await semanaService.delete(semana.id);
      toast.success('Semana eliminada exitosamente');
      loadSemanas();
    } catch (err: any) {
      console.error('Error al eliminar semana:', err);
      toast.error(err.response?.data?.message || 'Error al eliminar la semana');
    }
  };

  const handleDuplicate = async (semana: Semana, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Duplicar Semana',
      message: `¿Querés duplicar "${semana.titulo}" con sus videos, ejercicios y horarios?`,
      confirmText: 'Duplicar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      await semanaService.duplicate(semana.id);
      toast.success('Semana duplicada exitosamente');
      loadSemanas();
    } catch (err: any) {
      console.error('Error al duplicar semana:', err);
      toast.error(err.response?.data?.message || 'Error al duplicar la semana');
    }
  };

  const handleFormSuccess = () => loadSemanas();
  const handleCursadaSuccess = () => {
    setEditingCursada(null);
    loadCursadas();
  };

  const handleOpenNuevaCursada = () => {
    setEditingCursada(null);
    setIsCursadaFormOpen(true);
  };

  const handleOpenGestionarCursada = () => {
    setEditingCursada(cursadaActiva);
    setIsCursadaFormOpen(true);
  };

  const handleFinalizarCursada = async () => {
    if (!cursadaActiva) return;
    const confirmed = await confirm({
      title: 'Finalizar Cursada',
      message: `¿Estás seguro de que deseas finalizar "${cursadaActiva.titulo}"? Los alumnos dejarán de acceder a esta cursada y podrás crear una nueva.`,
      confirmText: 'Finalizar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      await cursadaService.finalizar(cursadaActiva.id);
      toast.success('Cursada finalizada exitosamente');
      loadCursadas();
    } catch (err: any) {
      console.error('Error al finalizar cursada:', err);
      toast.error(
        err.response?.data?.message || 'Error al finalizar la cursada'
      );
    }
  };

  const handleDuplicarCursada = async () => {
    if (!cursadaActiva) return;
    const confirmed = await confirm({
      title: 'Duplicar Cursada',
      message: `¿Querés duplicar "${cursadaActiva.titulo}" con sus comisiones, semanas, videos, horarios y ejercicios? La copia quedará inactiva.`,
      confirmText: 'Duplicar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      await cursadaService.duplicate(cursadaActiva.id);
      toast.success('Cursada duplicada exitosamente');
      loadCursadas();
    } catch (err: any) {
      console.error('Error al duplicar cursada:', err);
      toast.error(
        err.response?.data?.message || 'Error al duplicar la cursada'
      );
    }
  };

  const handleWeekClick = (semanaId: number) => {
    const activeComision =
      typeof comisionFilter === 'number' ? comisionFilter : alumnoComisionId;
    const query = activeComision ? `?comisionId=${activeComision}` : '';
    navigate(`/materia/${materiaId}/semanas/${semanaId}${query}`);
  };

  const handleCursadaChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const cursadaId = parseInt(e.target.value);
    const cursada = cursadas.find(c => c.id === cursadaId);
    if (cursada) {
      setCursadaActiva(cursada);
      if (canManageCursadas) {
        await loadComisiones(cursada.id);
        handleComisionFilterChange('todas');
      }
    }
  };

  const cursadasVisibles = canManageCursadas ? cursadas : alumnoCursadas;

  if (loadingPermissions || loadingCursada) {
    return <LoadingSpinner fullScreen size="lg" label="Cargando semanas..." />;
  }

  if (!cursadaActiva && !loadingCursada) {
    return (
      <div className="materia-page-shell">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        <div className="relative z-10 flex min-h-screen items-center">
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center rounded-3xl border border-white/10 bg-white/[0.96] px-6 py-10 shadow-2xl shadow-slate-950/15 dark:bg-slate-900/90 sm:px-8">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                <Calendar className="h-8 w-8 text-slate-950 dark:text-white" />
              </div>
              <h2 className="mb-4 text-2xl font-black text-slate-950 dark:text-white">
                No hay cursadas disponibles
              </h2>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                Para comenzar a gestionar semanas, primero debes iniciar una
                cursada.
              </p>
              {canCreate && (
                <Button
                  variant="primary"
                  onClick={handleOpenNuevaCursada}
                  className="mx-auto rounded-2xl border-none bg-emerald-400 px-5 py-3 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Iniciar Cursada
                </Button>
              )}
            </div>
          </div>
        </div>

        <CursadaFormModal
          isOpen={isCursadaFormOpen}
          onClose={() => {
            setIsCursadaFormOpen(false);
            setEditingCursada(null);
          }}
          onSuccess={handleCursadaSuccess}
          materiaId={parseInt(materiaId || '0')}
        />
      </div>
    );
  }

  return (
    <MateriaAccessGuard
      materiaId={parseInt(materiaId || '0')}
      materiaNombre="Materia"
      cursadaId={cursadaActiva?.id || 1}
    >
      <div className="materia-page-shell">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />

        {/* HERO SECTION */}
        <section className="materia-hero">
          <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="max-w-4xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="materia-chip-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                  <Sparkles className="h-3.5 w-3.5" />
                  Aula digital ITI
                </span>
                <span className="materia-chip-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold">
                  <Calendar className="h-3.5 w-3.5 text-slate-700 dark:text-white" />
                  Gestión de semanas
                </span>
              </div>
              <h1 className="materia-hero-title max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
                {config.pages.semanas?.titulo || 'Semanas'}
              </h1>
              <p className="materia-hero-description mt-4 max-w-3xl text-lg font-medium leading-8">
                {config.pages.semanas?.descripcion ||
                  'Gestiona las semanas de la cursada.'}
              </p>
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
          {/* (Se muestra un único botón de 'Nueva Semana' en el bloque de controles) */}

          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.96] p-4 shadow-2xl shadow-slate-950/10 dark:bg-slate-900/90 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-[180px] xl:max-w-[260px] xl:flex-none">
                <p className="text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  Gestiona las semanas de la cursada
                </p>
              </div>

              <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-1 xl:flex-wrap xl:items-center xl:justify-end">
                {cursadasVisibles.length > 1 && (
                  <div className="relative min-w-0">
                    <button
                      onClick={() =>
                        setIsCursadaDropdownOpen(!isCursadaDropdownOpen)
                      }
                      className="group flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 sm:min-w-[200px] xl:w-[220px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Calendar className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors dark:text-white" />
                        <span className="truncate">
                          {cursadaActiva?.titulo || 'Seleccionar cursada'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCursadaDropdownOpen ? 'rotate-180 text-blue-500' : ''}`}
                      />
                    </button>

                    {isCursadaDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsCursadaDropdownOpen(false)}
                        />
                        <div className="absolute left-0 z-20 mt-2 w-full min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md animate-in fade-in zoom-in-95 duration-100 dark:border-gray-700 dark:bg-gray-800 sm:min-w-[240px]">
                          <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                            {cursadasVisibles.map(cursada => (
                              <button
                                key={cursada.id}
                                onClick={() => {
                                  handleCursadaChange({
                                    target: { value: cursada.id.toString() },
                                  } as any);
                                  setIsCursadaDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${cursadaActiva?.id === cursada.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              >
                                <div className="flex flex-col items-start">
                                  <span>{cursada.titulo}</span>
                                  <span className="text-[10px] text-gray-400">
                                    {cursada.activa
                                      ? 'Activa'
                                      : 'Pausada / finalizada'}
                                  </span>
                                </div>
                                {cursadaActiva?.id === cursada.id && (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {canManageCursadas && comisionesDisponibles.length > 0 && (
                  <div className="relative min-w-0">
                    <button
                      onClick={() =>
                        setIsComisionDropdownOpen(!isComisionDropdownOpen)
                      }
                      className="group flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 sm:min-w-[220px] xl:w-[230px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Filter className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="truncate">
                          {comisionFilter === 'todas'
                            ? 'Todas las comisiones'
                            : comisionesDisponibles.find(
                                c => c.id === comisionFilter
                              )?.nombre || 'Seleccionar'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isComisionDropdownOpen ? 'rotate-180 text-blue-500' : ''}`}
                      />
                    </button>

                    {isComisionDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsComisionDropdownOpen(false)}
                        />
                        <div className="absolute right-0 z-20 mt-2 w-full min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md animate-in fade-in zoom-in-95 duration-100 dark:border-gray-700 dark:bg-gray-800 sm:min-w-[240px]">
                          <div className="p-1">
                            <button
                              onClick={() => {
                                handleComisionFilterChange('todas');
                                setIsComisionDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${comisionFilter === 'todas' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                              <span>Todas las comisiones</span>
                              {comisionFilter === 'todas' && (
                                <Check className="w-4 h-4" />
                              )}
                            </button>

                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                              {comisionesDisponibles.map(comision => (
                                <button
                                  key={comision.id}
                                  onClick={() => {
                                    handleComisionFilterChange(comision.id);
                                    setIsComisionDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${comisionFilter === comision.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                  <span>{comision.nombre}</span>
                                  {comisionFilter === comision.id && (
                                    <Check className="w-4 h-4" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={handleOpenGestionarCursada}
                    className="h-11 w-full justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/80 xl:w-auto"
                  >
                    <Settings className="w-5 h-5 mr-2 text-slate-700 dark:text-white/80" />
                    Gestionar Cursada
                  </Button>
                )}

                {canCreate && (
                  <Button
                    variant="outline"
                    onClick={handleOpenNuevaCursada}
                    className="h-11 w-full justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/80 xl:w-auto"
                  >
                    <Plus className="w-5 h-5 mr-2 text-slate-700 dark:text-white/80" />
                    Nueva Cursada
                  </Button>
                )}

                {canEdit && cursadaActiva?.activa && (
                  <Button
                    variant="outline"
                    onClick={handleDuplicarCursada}
                    className="h-11 w-full justify-center whitespace-nowrap rounded-xl px-3 text-sm xl:w-auto"
                  >
                    <Copy className="w-5 h-5 mr-2" />
                    Duplicar Cursada
                  </Button>
                )}

                {canEdit && cursadaActiva?.activa && (
                  <Button
                    variant="outline"
                    onClick={handleFinalizarCursada}
                    className="h-11 w-full justify-center whitespace-nowrap rounded-xl px-3 text-sm xl:w-auto"
                  >
                    <StopCircle className="w-5 h-5 mr-2" />
                    Finalizar Cursada
                  </Button>
                )}

                {canCreate && cursadaActiva?.activa && (
                  <Button
                    variant="primary"
                    onClick={handleCreate}
                    className="h-11 w-full justify-center whitespace-nowrap rounded-xl border-none bg-emerald-400 px-4 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300 dark:text-white xl:w-auto"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Nueva Semana
                  </Button>
                )}
              </div>
            </div>

            {cursadaActiva && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-white" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {cursadaActiva.titulo}
                  </span>
                  {cursadaActiva.activa ? (
                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full">
                      Activa
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 rounded-full">
                      Pausada / finalizada
                    </span>
                  )}
                </div>
                {cursadaActiva.descripcion && (
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    {cursadaActiva.descripcion}
                  </p>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <LoadingSpinner size="lg" label="Cargando semanas..." />
          ) : error ? (
            <ErrorComponent
              message={error || undefined}
              onRetry={loadSemanas}
            />
          ) : semanas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.96] px-6 py-14 text-center shadow-2xl shadow-slate-950/15 dark:bg-slate-900/90">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-2xl font-black text-slate-950 dark:text-white">
                No hay semanas disponibles
              </h3>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                Comienza creando la primera semana de la cursada.
              </p>
              {canCreate && cursadaActiva?.activa && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300"
                >
                  <Plus className="w-5 h-5" />
                  Crear Primera Semana
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                    Semanas de la cursada
                  </h2>
                  <Badge variant="info" size="sm">
                    {semanas.length} semanas
                  </Badge>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[...semanas]
                    .sort((a, b) => b.numeroSemana - a.numeroSemana)
                    .map(semana => {
                      const activeComisionId =
                        typeof comisionFilter === 'number'
                          ? comisionFilter
                          : alumnoComisionId;
                      const classDate = activeComisionId
                        ? semana.fechasClasePorComision?.[
                            String(activeComisionId)
                          ]
                        : undefined;

                      const comisionNames =
                        semana.comisiones && semana.comisiones.length > 0
                          ? semana.comisiones.map(c => c.nombre)
                          : semana.fechasClasePorComision
                            ? (Object.keys(semana.fechasClasePorComision)
                                .map(
                                  id =>
                                    comisionesDisponibles.find(
                                      c => c.id === Number(id)
                                    )?.nombre
                                )
                                .filter(Boolean) as string[])
                            : [];

                      return (
                        <WeekCard
                          key={semana.id}
                          weekNumber={semana.numeroSemana}
                          title={semana.titulo}
                          description={semana.descripcion || ''}
                          startDate={semana.fechaInicio}
                          classDate={classDate}
                          hasImportantNotice={!!semana.importante}
                          hasVideos={false}
                          hasExercises={false}
                          tags={[]}
                          comisiones={comisionNames}
                          onClick={() => handleWeekClick(semana.id)}
                          onEdit={
                            canEdit ? e => handleEdit(semana, e) : undefined
                          }
                          onDelete={
                            canDelete ? e => handleDelete(semana, e) : undefined
                          }
                          onDuplicate={
                            canCreate
                              ? e => handleDuplicate(semana, e)
                              : undefined
                          }
                        />
                      );
                    })}
                </div>
              </section>
            </div>
          )}

          {/* Modales */}
          <SemanaFormModal
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedSemana(null);
            }}
            onSuccess={handleFormSuccess}
            semana={selectedSemana}
            cursadaId={cursadaActiva?.id || 0}
            materiaId={parseInt(materiaId || '0')}
          />

          <CursadaFormModal
            isOpen={isCursadaFormOpen}
            onClose={() => {
              setIsCursadaFormOpen(false);
              setEditingCursada(null);
            }}
            onSuccess={handleCursadaSuccess}
            cursada={editingCursada}
            materiaId={parseInt(materiaId || '0')}
          />

          <ConfirmDialog {...confirmState} />
        </div>
      </div>
    </MateriaAccessGuard>
  );
};

export default SemanasPage;
