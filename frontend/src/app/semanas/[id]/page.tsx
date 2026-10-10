import React, { useState, useEffect } from 'react';
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  BookOpen,
  Clock,
  Video,
  Plus,
  Pencil,
} from 'lucide-react';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorComponent } from '../../../components/ErrorComponent';
import { Button } from '../../../shared/design-system/components/Button';
import { Card } from '../../../shared/design-system/components/Card';
import { VideoFormModal } from '../../../components/VideoFormModal';
import { VideoCollection } from '../../../components/VideoCollection';
import { EjercicioFormModal } from '../../../components/EjercicioFormModal';
import { HorarioFormModal } from '../../../components/HorarioFormModal';
import { SemanaFormModal } from '../../../components/SemanaFormModal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { usePermissions, useToast, useConfirm } from '../../../hooks';
import { useAuth } from '../../auth/contexts/AuthContext';
import {
  semanaService,
  videoService,
  ejercicioService,
  horarioService,
  comisionService,
  Comision,
  Semana,
  Video as VideoType,
  Ejercicio,
  Horario,
} from '../../../services';
import { BlockRenderer } from '../../../components/BlockRenderer';
import {
  ExerciseCard,
  HorarioCard,
  SectionEmpty,
  VideoCard,
} from './components';
import { usuarioService } from '../../../services/usuario.service';
import { useStudentPreview } from '../../../contexts/StudentPreviewContext';

const formatCalendarDate = (
  value: string,
  options?: Intl.DateTimeFormatOptions
) => {
  const [year, month, day] = value.split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return '';

  return new Date(year, month - 1, day).toLocaleDateString('es-AR', options);
};

export const SemanaDetailPage: React.FC = () => {
  const { id: materiaId, semanaId } = useParams<{
    id: string;
    semanaId: string;
  }>();
  const navigate = useNavigate();
  const { canCreate, canEdit, canDelete, isAlumno, canManageCurrentMateria } =
    usePermissions();
  const toast = useToast();
  const { confirmState, confirm } = useConfirm();
  const { isInitialized, authenticated } = useAuth();
  const { selection, isPreviewing } = useStudentPreview();

  // Estados
  const [semana, setSemana] = useState<Semana | null>(null);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [orderingHorarios, setOrderingHorarios] = useState(false);
  const [semanasNav, setSemanasNav] = useState<Semana[]>([]);
  const [loadingSemanasNav, setLoadingSemanasNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comisión y filtrado
  const [searchParams, setSearchParams] = useSearchParams();
  const urlComisionParam = searchParams.get('comisionId');
  const [comisionFilter, setComisionFilter] = useState<number | 'todas'>(() => {
    if (urlComisionParam && !isNaN(Number(urlComisionParam))) {
      return Number(urlComisionParam);
    }
    return 'todas';
  });
  const [comisiones, setComisiones] = useState<Comision[]>([]);

  // Estados de modales
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isEjercicioModalOpen, setIsEjercicioModalOpen] = useState(false);
  const [isHorarioModalOpen, setIsHorarioModalOpen] = useState(false);
  const [isSemanaModalOpen, setIsSemanaModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [selectedEjercicio, setSelectedEjercicio] = useState<Ejercicio | null>(
    null
  );
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);
  const cursadaId = semana?.cursadaId || semana?.cursada?.id || 0;
  const currentSemanaId = Number(semanaId);

  useEffect(() => {
    // Solo cargar si Auth.js está inicializado para evitar peticiones sin token
    if (isInitialized && authenticated) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    semanaId,
    isInitialized,
    authenticated,
    isPreviewing,
    selection?.comisionId,
  ]);

  const handleComisionChange = (nextFilter: number | 'todas') => {
    setComisionFilter(nextFilter);
    const newParams = new URLSearchParams(searchParams);
    if (nextFilter === 'todas') {
      newParams.delete('comisionId');
    } else {
      newParams.set('comisionId', String(nextFilter));
    }
    setSearchParams(newParams, { replace: true });

    if (semana) {
      loadSemanasNav(semana, nextFilter, comisiones);
    }
  };

  const loadData = async () => {
    if (!semanaId) return;
    setLoading(true);
    setError(null);
    try {
      // semanaService.getById() ya trae videos/ejercicios/horarios
      // embebidos (ver semana.service.ts en el backend): antes esta
      // pantalla pedia esos mismos datos 3 veces mas por separado
      // (videoService/ejercicioService/horarioService.getBySemana), cada
      // uno con su propia consulta a la base, para terminar mostrando
      // exactamente lo mismo.
      const semanaData =
        isPreviewing && selection
          ? await semanaService.getStudentPreview(
              parseInt(semanaId),
              selection.comisionId
            )
          : await semanaService.getById(parseInt(semanaId));
      setSemana(semanaData);
      setVideos(semanaData.videos || []);
      setEjercicios(semanaData.ejercicios || []);
      setHorarios(semanaData.horarios || []);

      const navCursadaId = semanaData.cursadaId || semanaData.cursada?.id;
      const canManage = canManageCurrentMateria || !isAlumno;
      let comisionesCursada: Comision[] = [];

      if (navCursadaId && canManage) {
        try {
          comisionesCursada = await comisionService.getByCursada(navCursadaId);
          setComisiones(comisionesCursada);
        } catch (err) {
          console.error('Error al cargar comisiones de cursada:', err);
        }
      }

      // Sincronizar comisionFilter si viene en URL o inferir si la semana es exclusiva de una sola comisión
      let activeFilter = comisionFilter;
      const currentUrlComision = searchParams.get('comisionId');
      if (currentUrlComision && !isNaN(Number(currentUrlComision))) {
        activeFilter = Number(currentUrlComision);
        setComisionFilter(activeFilter);
      } else if (canManage && semanaData.comisiones?.length === 1) {
        activeFilter = semanaData.comisiones[0].id;
        setComisionFilter(activeFilter);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('comisionId', String(activeFilter));
        setSearchParams(newParams, { replace: true });
      }

      loadSemanasNav(semanaData, activeFilter, comisionesCursada);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setError(error.message || 'Error al cargar los datos de la semana');
    } finally {
      setLoading(false);
    }
  };

  const loadSemanasNav = async (
    semanaActual: Semana,
    filterComision: number | 'todas' = comisionFilter,
    comisionesDisponibles: Comision[] = comisiones
  ) => {
    const navCursadaId = semanaActual.cursadaId || semanaActual.cursada?.id;
    const navMateriaId =
      Number(materiaId) || semanaActual.cursada?.materiaId || 0;
    if (!navCursadaId || !navMateriaId) return;

    setLoadingSemanasNav(true);
    try {
      let data: Semana[] = [];

      if (isAlumno && !canManageCurrentMateria) {
        const comisionId = isPreviewing
          ? selection?.comisionId
          : (
              await usuarioService.verificarEstadoInscripcion(
                navMateriaId,
                navCursadaId
              )
            ).inscripcion?.comisionId;
        if (comisionId) {
          data = await semanaService.getVisiblesParaAlumno(
            navCursadaId,
            comisionId
          );
        }
      } else {
        if (filterComision !== 'todas') {
          data = await semanaService.getByComision(filterComision);
        } else {
          data = await semanaService.getByCursada(navCursadaId);
        }
      }

      // Deduplicar semanas por id y enriquecer comisiones si faltan
      const map = new Map<number, Semana>();
      for (const item of data) {
        if (!map.has(item.id)) {
          let itemComisiones = item.comisiones;
          if (
            (!itemComisiones || itemComisiones.length === 0) &&
            item.fechasClasePorComision &&
            comisionesDisponibles.length > 0
          ) {
            const comIds = Object.keys(item.fechasClasePorComision).map(Number);
            itemComisiones = comisionesDisponibles.filter(c =>
              comIds.includes(c.id)
            );
          }
          map.set(item.id, { ...item, comisiones: itemComisiones });
        }
      }
      const uniqueData = Array.from(map.values());

      setSemanasNav(
        uniqueData.sort((a, b) => {
          const byNumber = (a.numeroSemana || 0) - (b.numeroSemana || 0);
          if (byNumber !== 0) return byNumber;
          return (
            new Date(a.fechaInicio).getTime() -
            new Date(b.fechaInicio).getTime()
          );
        })
      );
    } catch (error) {
      console.error('Error al cargar navegacion de semanas:', error);
      setSemanasNav([]);
    } finally {
      setLoadingSemanasNav(false);
    }
  };

  const handleEditSemana = () => {
    setIsSemanaModalOpen(true);
  };

  // Handlers de Videos
  const handleCreateVideo = () => {
    setSelectedVideo(null);
    setIsVideoModalOpen(true);
  };

  const handleEditVideo = (video: VideoType) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleDeleteVideo = async (video: VideoType) => {
    const confirmed = await confirm({
      title: 'Eliminar Video',
      message: `¿Estás seguro de que deseas eliminar "${video.titulo}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (confirmed) {
      try {
        await videoService.delete(video.id);
        toast.success('Video eliminado exitosamente');
        loadData();
      } catch (error: any) {
        console.error('Error al eliminar video:', error);
        toast.error('Error al eliminar el video');
      }
    }
  };

  // Handlers de Ejercicios
  const handleCreateEjercicio = () => {
    setSelectedEjercicio(null);
    setIsEjercicioModalOpen(true);
  };

  const handleEditEjercicio = (ejercicio: Ejercicio) => {
    setSelectedEjercicio(ejercicio);
    setIsEjercicioModalOpen(true);
  };

  const handleDeleteEjercicio = async (ejercicio: Ejercicio) => {
    const confirmed = await confirm({
      title: 'Eliminar Ejercicio',
      message: `¿Estás seguro de que deseas eliminar "${ejercicio.titulo}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (confirmed) {
      try {
        await ejercicioService.delete(ejercicio.id);
        toast.success('Ejercicio eliminado exitosamente');
        loadData();
      } catch (error: any) {
        console.error('Error al eliminar ejercicio:', error);
        toast.error('Error al eliminar el ejercicio');
      }
    }
  };

  // Handlers de Horarios
  const handleCreateHorario = () => {
    setSelectedHorario(null);
    setIsHorarioModalOpen(true);
  };

  const handleEditHorario = (horario: Horario) => {
    setSelectedHorario(horario);
    setIsHorarioModalOpen(true);
  };

  const handleDeleteHorario = async (horario: Horario) => {
    const confirmed = await confirm({
      title: 'Eliminar Horario',
      message: `¿Estás seguro de que deseas eliminar "${horario.titulo}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (confirmed) {
      try {
        await horarioService.delete(horario.id);
        toast.success('Horario eliminado exitosamente');
        loadData();
      } catch (error: any) {
        console.error('Error al eliminar horario:', error);
        toast.error('Error al eliminar el horario');
      }
    }
  };

  const handleMoveHorario = async (fromIndex: number, toIndex: number) => {
    if (
      orderingHorarios ||
      toIndex < 0 ||
      toIndex >= horarios.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const previous = horarios;
    const next = [...horarios];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const optimistic = next.map((horario, index) => ({
      ...horario,
      orden: index + 1,
    }));

    setHorarios(optimistic);
    setOrderingHorarios(true);
    try {
      const saved = await horarioService.reorder(
        currentSemanaId,
        optimistic.map(horario => horario.id)
      );
      setHorarios(saved);
      toast.success('Orden de horarios actualizado');
    } catch (error) {
      console.error('Error al ordenar horarios:', error);
      setHorarios(previous);
      toast.error('No se pudo guardar el orden de los horarios');
    } finally {
      setOrderingHorarios(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="lg"
        label="Cargando detalle de la semana..."
      />
    );
  }

  if (error || !semana) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorComponent
          message={error || 'Semana no encontrada'}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="materia-page-shell semana-detail-shell">
      <div className="materia-page-gradient" />
      <div className="materia-page-grid" />

      {/* HERO HEADER */}
      <section className="materia-hero">
        <div className="mx-auto max-w-screen-2xl min-w-0 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-4xl min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="materia-chip-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                <Calendar className="h-3.5 w-3.5 text-slate-700 dark:text-white" />
                Semana {semana?.numeroSemana}
              </span>
            </div>
            <h1 className="materia-hero-title break-words text-3xl font-black tracking-tight sm:text-5xl">
              {semana?.titulo}
            </h1>
            {semana?.fechaInicio && (
              <p className="materia-hero-description mt-3 text-lg font-medium leading-7">
                {formatCalendarDate(semana.fechaInicio)}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-screen-2xl min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              const query =
                comisionFilter !== 'todas'
                  ? `?comisionId=${comisionFilter}`
                  : '';
              navigate(`/materia/${materiaId}/semanas${query}`);
            }}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a Semanas
          </button>

          <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-emerald-300 px-3 py-1 text-sm font-black text-slate-950 shadow-sm shadow-emerald-950/10">
                  Semana {semana.numeroSemana}
                </span>
                {semana.fechaInicio && (
                  <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-600 dark:text-white" />
                    {formatCalendarDate(semana.fechaInicio)}
                  </span>
                )}
                {semana.comisiones && semana.comisiones.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {semana.comisiones.map(c => c.nombre).join(', ')}
                  </span>
                )}
              </div>
              <h1 className="mb-2 break-words text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                {semana.titulo}
              </h1>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditSemana}
                className="w-full justify-center rounded-2xl border border-blue-200 bg-white/90 px-4 py-2 font-black text-blue-700 shadow-lg shadow-slate-950/10 transition-all hover:-translate-y-0.5 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-slate-900/90 dark:text-blue-200 dark:hover:bg-blue-950/45 md:w-auto"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar Semana
              </Button>
            )}
          </div>
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <WeeksSidebar
            semanas={semanasNav}
            currentSemanaId={currentSemanaId}
            materiaId={Number(materiaId)}
            loading={loadingSemanasNav}
            comisiones={comisiones}
            selectedComision={comisionFilter}
            onComisionChange={handleComisionChange}
            canManageComisiones={canManageCurrentMateria || !isAlumno}
          />

          <div className="min-w-0">
            {/* Avisos e Informacion Importante */}
            {(semana.importante || semana.avisos) && (
              <div
                className={`mb-8 grid grid-cols-1 gap-4 ${
                  semana.importante && semana.avisos ? 'md:grid-cols-2' : ''
                }`}
              >
                {semana.importante && (
                  <Card className="overflow-hidden rounded-2xl border border-red-200 bg-red-50/90 p-0 shadow-sm dark:border-red-900/45 dark:bg-red-950/20">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-900/35 dark:text-red-200">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="mb-1 text-base font-black text-red-950 dark:text-red-100">
                            Informacion importante
                          </h3>
                          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-red-900/85 dark:text-red-100/85">
                            {semana.importante}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
                {semana.avisos && (
                  <Card className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/90 p-0 shadow-sm dark:border-amber-900/45 dark:bg-amber-950/20">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-200">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="mb-1 text-base font-black text-amber-950 dark:text-amber-100">
                            Avisos
                          </h3>
                          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-amber-900/85 dark:text-amber-100/85">
                            {semana.avisos}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Block Content */}
            {semana.contenido?.blocks && semana.contenido.blocks.length > 0 && (
              <div className="mx-auto mb-8 max-w-5xl">
                <BlockRenderer content={semana.contenido} />
              </div>
            )}

            {/* Horarios */}
            <section className="mb-8 min-w-0">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950 dark:text-white">
                  <Clock className="w-6 h-6" />
                  Horarios
                </h2>
                {canCreate && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateHorario}
                    className="w-full justify-center sm:w-auto rounded-2xl border-none bg-emerald-400 px-4 py-2 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Horario
                  </Button>
                )}
              </div>
              {horarios.length === 0 ? (
                <SectionEmpty
                  icon={<Clock className="h-5 w-5" />}
                  title="No hay horarios configurados para esta semana"
                  hint="Acá se publican las clases presenciales y los encuentros virtuales."
                />
              ) : (
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {horarios.map((horario, index) => (
                    <HorarioCard
                      key={horario.id}
                      horario={horario}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEdit={handleEditHorario}
                      onDelete={handleDeleteHorario}
                      position={index}
                      total={horarios.length}
                      ordering={orderingHorarios}
                      onMoveUp={() => handleMoveHorario(index, index - 1)}
                      onMoveDown={() => handleMoveHorario(index, index + 1)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Videos */}
            <section className="mb-8 min-w-0">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950 dark:text-white">
                  <Video className="w-6 h-6" />
                  Videos
                </h2>
                {canCreate && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateVideo}
                    className="w-full justify-center sm:w-auto rounded-2xl border-none bg-emerald-400 px-4 py-2 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar video o playlist
                  </Button>
                )}
              </div>
              {videos.length === 0 ? (
                <SectionEmpty
                  icon={<Video className="h-5 w-5" />}
                  title="No hay videos disponibles para esta semana"
                  hint="Las clases grabadas y los materiales en video aparecen acá."
                />
              ) : (
                <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {videos.map(video => (
                    <VideoCollection
                      key={video.id}
                      video={video}
                      onEdit={canEdit ? handleEditVideo : undefined}
                      onDelete={canDelete ? handleDeleteVideo : undefined}
                      renderVideo={(item, isPlaylistItem) => (
                        <VideoCard
                          video={item}
                          canEdit={canEdit && !isPlaylistItem}
                          canDelete={canDelete && !isPlaylistItem}
                          onEdit={handleEditVideo}
                          onDelete={handleDeleteVideo}
                        />
                      )}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Ejercicios */}
            <section className="mb-8 min-w-0">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950 dark:text-white">
                  <BookOpen className="w-6 h-6" />
                  Ejercicios
                </h2>
                {canCreate && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateEjercicio}
                    className="w-full justify-center sm:w-auto rounded-2xl border-none bg-emerald-400 px-4 py-2 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Ejercicio
                  </Button>
                )}
              </div>
              {ejercicios.length === 0 ? (
                <SectionEmpty
                  icon={<BookOpen className="h-5 w-5" />}
                  title="No hay ejercicios asignados para esta semana"
                  hint="Cuando se publiquen, vas a poder abrirlos desde acá."
                />
              ) : (
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ejercicios.map(ejercicio => (
                    <ExerciseCard
                      key={ejercicio.id}
                      ejercicio={ejercicio}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      isStudentPreview={isPreviewing}
                      onEdit={handleEditEjercicio}
                      onDelete={handleDeleteEjercicio}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Modales */}
        <VideoFormModal
          isOpen={isVideoModalOpen}
          onClose={() => {
            setIsVideoModalOpen(false);
            setSelectedVideo(null);
          }}
          onSuccess={loadData}
          video={selectedVideo}
          semanaId={parseInt(semanaId || '0')}
          cursadaId={cursadaId || undefined}
          materiaId={Number(materiaId) || undefined}
        />

        <EjercicioFormModal
          isOpen={isEjercicioModalOpen}
          onClose={() => {
            setIsEjercicioModalOpen(false);
            setSelectedEjercicio(null);
          }}
          onSuccess={loadData}
          ejercicio={selectedEjercicio}
          semanaId={parseInt(semanaId || '0')}
          cursadaId={cursadaId}
        />

        <SemanaFormModal
          isOpen={isSemanaModalOpen}
          onClose={() => setIsSemanaModalOpen(false)}
          onSuccess={loadData}
          semana={semana}
          cursadaId={cursadaId}
          materiaId={parseInt(materiaId || '0')}
        />

        <HorarioFormModal
          isOpen={isHorarioModalOpen}
          onClose={() => {
            setIsHorarioModalOpen(false);
            setSelectedHorario(null);
          }}
          onSuccess={loadData}
          horario={selectedHorario}
          semanaId={parseInt(semanaId || '0')}
        />

        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          onConfirm={confirmState.onConfirm}
          onCancel={confirmState.onCancel}
        />
      </div>
    </div>
  );
};

export default SemanaDetailPage;

function WeeksSidebar({
  semanas,
  currentSemanaId,
  materiaId,
  loading,
  comisiones = [],
  selectedComision = 'todas',
  onComisionChange,
  canManageComisiones = false,
}: {
  semanas: Semana[];
  currentSemanaId: number;
  materiaId: number;
  loading: boolean;
  comisiones?: Comision[];
  selectedComision?: number | 'todas';
  onComisionChange?: (comisionId: number | 'todas') => void;
  canManageComisiones?: boolean;
}) {
  const currentIndex = semanas.findIndex(
    semana => semana.id === currentSemanaId
  );
  const previous = currentIndex > 0 ? semanas[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < semanas.length - 1
      ? semanas[currentIndex + 1]
      : null;

  const formatDate = (value?: string) => {
    if (!value) return '';
    return formatCalendarDate(value, {
      day: '2-digit',
      month: 'short',
    });
  };

  const buildUrl = (semanaId: number) => {
    const query =
      selectedComision !== 'todas' ? `?comisionId=${selectedComision}` : '';
    return `/materia/${materiaId}/semanas/${semanaId}${query}`;
  };
  const current = currentIndex >= 0 ? semanas[currentIndex] : null;
  const compactNavRef = React.useRef<HTMLElement>(null);
  const desktopNavRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = compactNavRef.current;
    const activeLink = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && activeLink) {
      nav.scrollLeft = Math.max(
        0,
        activeLink.offsetLeft - (nav.clientWidth - activeLink.clientWidth) / 2
      );
    }

    const desktopNav = desktopNavRef.current;
    const desktopActiveLink = desktopNav?.querySelector<HTMLElement>(
      '[aria-current="page"]'
    );
    if (desktopNav && desktopActiveLink) {
      desktopActiveLink.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [currentSemanaId, semanas.length]);

  if (!materiaId) return null;

  return (
    <aside className="z-20 min-w-0 self-start xl:sticky xl:top-[5.25rem]">
      {/* En pantallas chicas, la navegacion conserva todas las semanas sin
          ocupar la altura de una barra lateral completa. */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/20 xl:hidden">
        {canManageComisiones && comisiones.length > 0 && onComisionChange && (
          <div className="mb-2">
            <div className="relative">
              <select
                aria-label="Filtrar por comisión"
                value={selectedComision}
                onChange={e => {
                  const val = e.target.value;
                  onComisionChange(val === 'todas' ? 'todas' : Number(val));
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 transition focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:focus:bg-slate-900"
              >
                <option value="todas">Todas las comisiones</option>
                {comisiones.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}

        <div className="flex min-w-0 items-center gap-2">
          <CompactWeekJumpLink
            semana={previous}
            label="Semana anterior"
            icon={<ChevronLeft className="h-5 w-5" />}
            buildUrl={buildUrl}
          />

          <div className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl bg-slate-100 px-3 text-center dark:bg-slate-800">
            <span className="shrink-0 text-sm font-black text-slate-950 dark:text-white">
              {current ? `Semana ${current.numeroSemana}` : 'Semanas'}
            </span>
            {current && (
              <span className="ml-2 hidden min-w-0 truncate text-xs font-semibold text-slate-500 dark:text-slate-400 sm:block">
                {current.titulo}
              </span>
            )}
            <span className="ml-2 shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">
              {currentIndex >= 0
                ? `${currentIndex + 1}/${semanas.length}`
                : semanas.length}
            </span>
          </div>

          <CompactWeekJumpLink
            semana={next}
            label="Semana siguiente"
            icon={<ChevronRight className="h-5 w-5" />}
            buildUrl={buildUrl}
          />
        </div>

        {loading ? (
          <p className="px-2 pb-1 pt-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cargando semanas...
          </p>
        ) : semanas.length === 0 ? (
          <p className="px-2 pb-1 pt-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            No hay semanas visibles.
          </p>
        ) : (
          <nav
            ref={compactNavRef}
            className="mt-2 flex min-w-0 gap-1.5 overflow-x-auto px-0.5 pb-2 [scrollbar-width:thin]"
            aria-label="Todas las semanas"
          >
            {semanas.map(item => {
              const active = item.id === currentSemanaId;
              const comisionNames =
                item.comisiones && item.comisiones.length > 0
                  ? item.comisiones.map(c => c.nombre).join(', ')
                  : '';
              const tooltip = comisionNames
                ? `Semana ${item.numeroSemana}: ${item.titulo} (${comisionNames})`
                : `Semana ${item.numeroSemana}: ${item.titulo}`;

              return (
                <Link
                  key={item.id}
                  to={buildUrl(item.id)}
                  className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border px-2 text-xs font-black transition-colors sm:min-w-11 ${
                    active
                      ? 'border-emerald-400 bg-emerald-400 text-slate-950 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/25'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={tooltip}
                  title={tooltip}
                >
                  {item.numeroSemana}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className="hidden max-h-[calc(100dvh-6.75rem)] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/20 xl:flex">
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Navegacion
            </p>
            <h2 className="text-base font-black text-slate-950 dark:text-white">
              Semanas
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {semanas.length}
          </span>
        </div>

        {canManageComisiones && comisiones.length > 0 && onComisionChange && (
          <div className="mb-3 shrink-0">
            <label
              htmlFor="sidebar-desktop-comision-select"
              className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Comisión
            </label>
            <div className="relative">
              <select
                id="sidebar-desktop-comision-select"
                value={selectedComision}
                onChange={e => {
                  const val = e.target.value;
                  onComisionChange(val === 'todas' ? 'todas' : Number(val));
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 transition focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:focus:bg-slate-900"
              >
                <option value="todas">Todas las comisiones</option>
                {comisiones.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}

        <div className="mb-3 grid shrink-0 grid-cols-2 gap-2">
          <WeekJumpLink
            semana={previous}
            label="Anterior"
            icon={<ChevronLeft className="h-4 w-4" />}
            buildUrl={buildUrl}
          />
          <WeekJumpLink
            semana={next}
            label="Siguiente"
            icon={<ChevronRight className="h-4 w-4" />}
            buildUrl={buildUrl}
            reverse
          />
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            Cargando semanas...
          </div>
        ) : semanas.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            No hay semanas visibles.
          </div>
        ) : (
          <nav
            ref={desktopNavRef}
            className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-1 pb-6 pr-1.5 [scrollbar-width:thin]"
          >
            {semanas.map(item => {
              const active = item.id === currentSemanaId;
              const displayDate =
                (selectedComision !== 'todas' &&
                  item.fechasClasePorComision?.[String(selectedComision)]) ||
                item.fechaInicio;

              return (
                <Link
                  key={item.id}
                  to={buildUrl(item.id)}
                  className={`group flex shrink-0 items-start gap-3 rounded-xl border p-3 transition-all ${
                    active
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-50'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/25'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                      active
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.numeroSemana}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-black leading-snug">
                      {item.titulo}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-xs font-semibold opacity-75">
                      {active ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5" />
                      )}
                      {active ? 'Actual' : formatDate(displayDate)}
                    </span>
                    {selectedComision === 'todas' &&
                      item.comisiones &&
                      item.comisiones.length > 0 && (
                        <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.comisiones.map(c => c.nombre).join(', ')}
                        </span>
                      )}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </aside>
  );
}

function CompactWeekJumpLink({
  semana,
  label,
  icon,
  buildUrl,
}: {
  semana: Semana | null;
  label: string;
  icon: React.ReactNode;
  buildUrl: (semanaId: number) => string;
}) {
  const className =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors';

  if (!semana) {
    return (
      <span
        className={`${className} cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-700`}
        aria-label={`${label} no disponible`}
      >
        {icon}
      </span>
    );
  }

  return (
    <Link
      to={buildUrl(semana.id)}
      className={`${className} border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/25`}
      aria-label={label}
      title={`${label}: ${semana.titulo}`}
    >
      {icon}
    </Link>
  );
}

function WeekJumpLink({
  semana,
  label,
  icon,
  buildUrl,
  reverse = false,
}: {
  semana: Semana | null;
  label: string;
  icon: React.ReactNode;
  buildUrl: (semanaId: number) => string;
  reverse?: boolean;
}) {
  if (!semana) {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-400 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-600">
        {label}
      </span>
    );
  }

  return (
    <Link
      to={buildUrl(semana.id)}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/25"
      title={semana.titulo}
    >
      {!reverse && icon}
      {label}
      {reverse && icon}
    </Link>
  );
}
