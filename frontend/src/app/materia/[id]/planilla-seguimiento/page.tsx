import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/contexts/AuthContext';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import {
  actividadService,
  PlanillaSeguimiento,
  AlumnoConEntregas,
  Actividad,
  UpdateEntregaDto,
  UpdateActividadDto,
} from '../../../../services/actividad.service';
import {
  ClipboardList,
  Plus,
  ExternalLink,
  MessageSquare,
  Trash2,
  Search,
  Edit3,
  Sparkles,
  Download,
  GitBranch,
  AlertTriangle,
} from 'lucide-react';
import { ActividadFormModal } from '../../../../components/ActividadFormModal';
import { ComentarioModal } from '../../../../components/ComentarioModal';
import { usuarioService } from '../../../../services/usuario.service';
import { usePermissions, useToast } from '../../../../hooks';
import { MateriaAccessGuard } from '../../../../components/MateriaAccessGuard';
import { useMateriaCursada } from '../../../../hooks/useMateriaCursada';
import { Button } from '../../../../shared/design-system/components/Button';
import {
  cursadaService,
  Cursada,
  comisionService,
  Comision,
} from '../../../../services';

type GetEntregaValue = (
  alumno: AlumnoConEntregas,
  actividad: Actividad,
  field: keyof UpdateEntregaDto
) => any;

// Contenido de una celda de calificacion: se usa tanto en la fila de la
// tabla (desktop) como en la tarjeta mobile, para no duplicar los controles
// de nota/comentario en dos lugares que podrian desincronizarse.
function ActividadEntregaCell({
  alumno,
  actividad,
  isDocente,
  isSaving,
  getEntregaValue,
  onCellChange,
  onSaveCell,
  onOpenComentario,
}: {
  alumno: AlumnoConEntregas;
  actividad: Actividad;
  isDocente: boolean;
  isSaving: boolean;
  getEntregaValue: GetEntregaValue;
  onCellChange: (
    alumnoId: number,
    actividadId: number,
    field: keyof UpdateEntregaDto,
    value: any
  ) => void;
  onSaveCell: (alumnoId: number, actividadId: number) => void;
  onOpenComentario: (
    alumnoId: number,
    actividadId: number,
    alumnoNombre: string,
    actividadNombre: string
  ) => void;
}) {
  const repoUrl = alumno.githubUser
    ? `${actividad.repositorioBase}${alumno.githubUser}`
    : null;
  const comentario = getEntregaValue(alumno, actividad, 'comentario');

  return (
    <div className="space-y-2">
      {repoUrl && (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-300"
        >
          <ExternalLink className="w-3 h-3" />
          Ver repositorio
        </a>
      )}

      {isDocente ? (
        <>
          {actividad.tipoCalificacion === 'numerico' ? (
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={getEntregaValue(alumno, actividad, 'notaNumerica')}
              onChange={e =>
                onCellChange(
                  alumno.id,
                  actividad.id,
                  'notaNumerica',
                  parseFloat(e.target.value) || null
                )
              }
              onBlur={() => onSaveCell(alumno.id, actividad.id)}
              disabled={isSaving}
              className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              placeholder="0-10"
            />
          ) : (
            <select
              value={getEntregaValue(alumno, actividad, 'notaConceptual')}
              onChange={e => {
                onCellChange(
                  alumno.id,
                  actividad.id,
                  'notaConceptual',
                  e.target.value || null
                );
                setTimeout(() => onSaveCell(alumno.id, actividad.id), 100);
              }}
              disabled={isSaving}
              className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Sin calificar</option>
              <option value="aprobado">Aprobado</option>
              <option value="desaprobado">Desaprobado</option>
              <option value="excelente">Excelente</option>
              <option value="muy_bueno">Muy Bueno</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="insuficiente">Insuficiente</option>
            </select>
          )}

          <div className="space-y-1">
            <button
              type="button"
              onClick={() =>
                onOpenComentario(
                  alumno.id,
                  actividad.id,
                  `${alumno.nombre} ${alumno.apellido}`,
                  actividad.nombre
                )
              }
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <MessageSquare className="w-3 h-3" />
              {comentario ? 'Editar Comentario' : 'Agregar Comentario'}
            </button>

            {comentario && (
              <div className="max-h-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                <div className="line-clamp-2">{String(comentario)}</div>
              </div>
            )}
          </div>

          {isSaving && (
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
              Guardando...
            </div>
          )}
        </>
      ) : (
        <>
          <div className="font-bold text-slate-950 dark:text-slate-100">
            {actividad.tipoCalificacion === 'numerico'
              ? alumno.entregas[actividad.id]?.notaNumerica || '-'
              : alumno.entregas[actividad.id]?.notaConceptual || '-'}
          </div>
          {alumno.entregas[actividad.id]?.comentario && (
            <button
              type="button"
              onClick={() =>
                onOpenComentario(
                  alumno.id,
                  actividad.id,
                  `${alumno.nombre} ${alumno.apellido}`,
                  actividad.nombre
                )
              }
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <MessageSquare className="w-3 h-3" />
              Ver Comentario
            </button>
          )}
        </>
      )}
    </div>
  );
}

const getNombreCompleto = (alumno: AlumnoConEntregas) =>
  [alumno.nombre, alumno.apellido]
    .map(value => value?.trim())
    .filter(Boolean)
    .join(' ') ||
  alumno.githubUser?.trim() ||
  'Sin nombre';

/**
 * Página de Planilla de Seguimiento
 * Permite a los docentes ver y editar calificaciones de todos los alumnos
 * Los alumnos solo pueden ver sus propias calificaciones
 */
const PlanillaSeguimientoPage: React.FC = () => {
  const { id: materiaIdStr } = useParams<{ id: string }>();
  const materiaId = parseInt(materiaIdStr || '0');
  const { isInitialized, authenticated } = useAuth();
  const toast = useToast();
  const { canManageCurrentMateria } = usePermissions();
  const { cursadaId, loadingCursada } = useMateriaCursada(materiaId || null);

  const [planilla, setPlanilla] = useState<PlanillaSeguimiento | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [cursadas, setCursadas] = useState<Cursada[]>([]);
  const [loadingCursadas, setLoadingCursadas] = useState(false);
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [selectedCursadaId, setSelectedCursadaId] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComisionId, setSelectedComisionId] = useState<number | 'all'>(
    'all'
  );
  const [selectedActividadId, setSelectedActividadId] = useState<
    number | 'all'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(
    null
  );
  const [editingCells, setEditingCells] = useState<{
    [key: string]: UpdateEntregaDto;
  }>({});
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
  const [comentarioModal, setComentarioModal] = useState<{
    isOpen: boolean;
    alumnoId: number;
    actividadId: number;
    alumnoNombre: string;
    actividadNombre: string;
  } | null>(null);

  const isDocente = canManageCurrentMateria;

  useEffect(() => {
    if (canManageCurrentMateria) {
      setAccessGranted(true);
    }
  }, [canManageCurrentMateria]);

  useEffect(() => {
    if (!materiaId || !canManageCurrentMateria) return;

    const loadCursadas = async () => {
      setLoadingCursadas(true);
      try {
        const data = await cursadaService.getByMateria(materiaId);
        setCursadas(data);
        setSelectedCursadaId(
          prev => prev || data.find(c => c.activa)?.id || data[0]?.id || null
        );
      } catch (error) {
        console.error('Error cargando cursadas:', error);
      } finally {
        setLoadingCursadas(false);
      }
    };

    loadCursadas();
  }, [materiaId, canManageCurrentMateria]);

  useEffect(() => {
    if (!canManageCurrentMateria && cursadaId) {
      setSelectedCursadaId(cursadaId);
    }
  }, [canManageCurrentMateria, cursadaId]);

  useEffect(() => {
    if (!selectedCursadaId) {
      setComisiones([]);
      setSelectedComisionId('all');
      return;
    }

    const loadComisiones = async () => {
      try {
        const data = await comisionService.getByCursada(selectedCursadaId);
        setComisiones(data);
        setSelectedComisionId(prev =>
          prev !== 'all' && !data.some(c => c.id === prev) ? 'all' : prev
        );
      } catch (error) {
        console.error('Error cargando comisiones:', error);
        setComisiones([]);
      }
    };

    loadComisiones();
  }, [selectedCursadaId]);

  useEffect(() => {
    // Solo cargar si Auth.js está inicializado para evitar peticiones sin token
    const canLoadAsDocente =
      canManageCurrentMateria && !loadingCursadas && !selectedCursadaId;
    const canLoadWithCursada = Boolean(selectedCursadaId);

    if (
      isInitialized &&
      authenticated &&
      accessGranted &&
      (canLoadAsDocente || canLoadWithCursada)
    ) {
      cargarPlanilla();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    materiaId,
    isInitialized,
    authenticated,
    accessGranted,
    selectedCursadaId,
    canManageCurrentMateria,
    loadingCursadas,
  ]);

  const cargarPlanilla = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await actividadService.obtenerPlanillaSeguimiento(
        materiaId,
        selectedCursadaId || undefined
      );
      setPlanilla(data);
    } catch (err) {
      console.error('Error cargando planilla:', err);
      setError('No se pudo cargar la planilla de seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearActividad = async (dto: any) => {
    try {
      await actividadService.crearActividad({ ...dto, materiaId });
      setIsModalOpen(false);
      await cargarPlanilla();
    } catch (err) {
      console.error('Error creando actividad:', err);
      throw err;
    }
  };

  const handleGuardarActividad = async (
    dto: UpdateActividadDto & { materiaId?: number }
  ) => {
    if (editingActividad) {
      await actividadService.actualizarActividad(editingActividad.id, dto);
      setEditingActividad(null);
      setIsModalOpen(false);
      await cargarPlanilla();
      return;
    }

    await handleCrearActividad(dto);
  };

  const handleEditarActividad = (actividad: Actividad) => {
    setEditingActividad(actividad);
    setIsModalOpen(true);
  };

  const handleCerrarActividadModal = () => {
    setEditingActividad(null);
    setIsModalOpen(false);
  };

  const getCellKey = (alumnoId: number, actividadId: number) =>
    `${alumnoId}-${actividadId}`;

  const handleCellChange = (
    alumnoId: number,
    actividadId: number,
    field: keyof UpdateEntregaDto,
    value: any
  ) => {
    const key = getCellKey(alumnoId, actividadId);
    setEditingCells(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSaveCell = async (alumnoId: number, actividadId: number) => {
    const key = getCellKey(alumnoId, actividadId);
    const changes = editingCells[key];

    if (!changes) return;

    setSavingCells(prev => new Set(prev).add(key));

    try {
      await actividadService.actualizarEntrega(actividadId, alumnoId, changes);

      // Actualizar planilla local
      setPlanilla(prev => {
        if (!prev) return prev;

        const updatedAlumnos = prev.alumnos.map(alumno => {
          if (alumno.id === alumnoId) {
            return {
              ...alumno,
              entregas: {
                ...alumno.entregas,
                [actividadId]: {
                  ...(alumno.entregas[actividadId] || {}),
                  ...changes,
                  actividadId,
                  alumnoId,
                },
              },
            };
          }
          return alumno;
        });

        return { ...prev, alumnos: updatedAlumnos };
      });

      // Limpiar cambios guardados
      setEditingCells(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } catch (err) {
      console.error('Error guardando entrega:', err);
      alert('Error al guardar la calificación');
    } finally {
      setSavingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const getEntregaValue = (
    alumno: AlumnoConEntregas,
    actividad: Actividad,
    field: keyof UpdateEntregaDto
  ) => {
    const key = getCellKey(alumno.id, actividad.id);
    const entrega = alumno.entregas[actividad.id];

    // Si hay cambios pendientes, mostrarlos
    if (editingCells[key]?.[field] !== undefined) {
      return editingCells[key][field];
    }

    // Sino, mostrar el valor guardado
    return entrega?.[field] || '';
  };

  const renderGiteaSummary = (alumno: AlumnoConEntregas) => {
    const summary = alumno.giteaSummary;
    if (!summary || summary.total === 0) {
      return (
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          Sin repos de ejercicios
        </span>
      );
    }

    return (
      <Link
        to={`/materia/${materiaId}/gitea?studentId=${alumno.id}`}
        className="mt-2 block space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-900 dark:hover:border-emerald-300/40 dark:hover:bg-emerald-300/10"
        title="Ver repositorios Gitea del alumno"
      >
        <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
          <GitBranch className="h-3.5 w-3.5" />
          {summary.created}/{summary.total} repos creados
        </div>
        {summary.failed > 0 && (
          <div className="flex items-center gap-1 font-bold text-red-600 dark:text-red-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            {summary.failed} con error
          </div>
        )}
        {summary.withoutCommits > 0 && (
          <div className="font-semibold text-amber-700 dark:text-amber-200">
            {summary.withoutCommits} sin commits
          </div>
        )}
        {summary.lastCommitAt && (
          <div className="text-slate-500 dark:text-slate-400">
            Ultimo commit: {new Date(summary.lastCommitAt).toLocaleDateString()}
          </div>
        )}
        <div className="font-bold text-emerald-700 dark:text-emerald-300">
          Ver repos por ejercicio
        </div>
      </Link>
    );
  };

  const handleOpenComentarioModal = (
    alumnoId: number,
    actividadId: number,
    alumnoNombre: string,
    actividadNombre: string
  ) => {
    setComentarioModal({
      isOpen: true,
      alumnoId,
      actividadId,
      alumnoNombre,
      actividadNombre,
    });
  };

  const handleSaveComentario = async (comentario: string) => {
    if (!comentarioModal) return;

    const { alumnoId, actividadId } = comentarioModal;

    // Guardar en el backend
    const key = getCellKey(alumnoId, actividadId);
    setSavingCells(prev => new Set(prev).add(key));

    try {
      await actividadService.actualizarEntrega(actividadId, alumnoId, {
        comentario,
      });

      // Actualizar planilla local
      setPlanilla(prev => {
        if (!prev) return prev;

        const updatedAlumnos = prev.alumnos.map(alumno => {
          if (alumno.id === alumnoId) {
            return {
              ...alumno,
              entregas: {
                ...alumno.entregas,
                [actividadId]: {
                  ...(alumno.entregas[actividadId] || {}),
                  comentario,
                  actividadId,
                  alumnoId,
                },
              },
            };
          }
          return alumno;
        });

        return { ...prev, alumnos: updatedAlumnos };
      });
    } catch (err) {
      console.error('Error al guardar el comentario:', err);
      toast.error('Error al guardar el comentario');
    } finally {
      setSavingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleEliminarActividad = async (
    actividadId: number,
    nombre: string
  ) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar la actividad "${nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await actividadService.eliminarActividad(actividadId);
      await cargarPlanilla();
    } catch (err) {
      console.error('Error eliminando actividad:', err);
      alert('Error al eliminar la actividad');
    }
  };

  const handleExportarPlanilla = async () => {
    try {
      const blob = await actividadService.exportarPlanillaSeguimiento(
        materiaId,
        selectedCursadaId || undefined
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `planilla-materia-${materiaId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Planilla exportada');
    } catch (err) {
      console.error('Error exportando planilla:', err);
      toast.error('No se pudo exportar la planilla');
    }
  };

  const activityAppliesToComision = (
    actividad: Actividad,
    comisionId?: number
  ) => {
    if (!comisionId) return true;
    if (!actividad.comisiones || actividad.comisiones.length === 0) return true;
    return actividad.comisiones.some(comision => comision.id === comisionId);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredAlumnos =
    planilla?.alumnos.filter(alumno => {
      const matchesSearch =
        !normalizedSearch ||
        `${alumno.nombre} ${alumno.apellido} ${alumno.githubUser || ''}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesComision =
        selectedComisionId === 'all' ||
        alumno.comision.id === selectedComisionId;
      return matchesSearch && matchesComision;
    }) || [];

  const filteredActividades =
    planilla?.actividades.filter(actividad => {
      const matchesActividad =
        selectedActividadId === 'all' || actividad.id === selectedActividadId;
      const matchesComision =
        selectedComisionId === 'all' ||
        activityAppliesToComision(actividad, selectedComisionId);
      return matchesActividad && matchesComision;
    }) || [];

  const studentsPerPage = 50;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAlumnos.length / studentsPerPage)
  );
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedAlumnos = filteredAlumnos.slice(
    (visiblePage - 1) * studentsPerPage,
    visiblePage * studentsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedComisionId, selectedCursadaId]);

  if (!isInitialized || loadingCursada || loadingCursadas) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <MateriaAccessGuard
      materiaId={materiaId}
      materiaNombre="Materia"
      cursadaId={selectedCursadaId || cursadaId}
      onAccessGranted={() => setAccessGranted(true)}
    >
      {error ? (
        <div className="materia-page-shell p-6">
          <div className="materia-page-gradient" />
          <div className="relative rounded-3xl border border-red-300/50 bg-red-50 p-5 shadow-2xl shadow-slate-950/10 dark:border-red-300/30 dark:bg-red-500/10 dark:shadow-black/20">
            <p className="font-bold text-red-700 dark:text-red-100">
              {error || 'Error desconocido'}
            </p>
          </div>
        </div>
      ) : loading || !planilla ? (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="materia-page-shell">
          <div className="materia-page-gradient" />
          <div className="materia-page-grid" />
          {/* Hero Header */}
          <section className="materia-hero">
            <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
              <div className="max-w-4xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="materia-chip-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                    <Sparkles className="h-3.5 w-3.5" />
                    Aula digital ITI
                  </span>
                  <span className="materia-chip-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Seguimiento academico
                  </span>
                </div>
                <h1 className="materia-hero-title max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
                  Planilla de Seguimiento
                </h1>
                <p className="materia-hero-description mt-4 max-w-3xl text-lg font-medium leading-8">
                  {isDocente
                    ? 'Gestiona las calificaciones de tus alumnos'
                    : 'Visualiza tus calificaciones'}
                </p>
              </div>
            </div>
          </section>

          <div className="relative z-10 space-y-5 p-4 sm:space-y-6 sm:p-6">
            {isDocente && (
              <div className="grid grid-cols-1 gap-3 rounded-3xl border border-white/10 bg-white/[0.96] p-4 shadow-2xl shadow-slate-950/15 dark:bg-slate-900/90 lg:grid-cols-[minmax(220px,1fr)_minmax(160px,220px)_minmax(160px,220px)_minmax(160px,220px)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar alumno o Gitea..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-white/10 dark:bg-slate-950/45 dark:text-white"
                  />
                </div>

                {cursadas.length > 0 && (
                  <select
                    value={selectedCursadaId || ''}
                    onChange={e =>
                      setSelectedCursadaId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-white/10 dark:bg-slate-950/45 dark:text-white"
                  >
                    {cursadas.map(cursada => (
                      <option key={cursada.id} value={cursada.id}>
                        {cursada.titulo}
                        {cursada.activa ? ' - Actual' : ' - Anterior'}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={selectedComisionId}
                  onChange={e =>
                    setSelectedComisionId(
                      e.target.value === 'all' ? 'all' : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-white/10 dark:bg-slate-950/45 dark:text-white"
                >
                  <option value="all">Todas las comisiones</option>
                  {comisiones.map(comision => (
                    <option key={comision.id} value={comision.id}>
                      {comision.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedActividadId}
                  onChange={e =>
                    setSelectedActividadId(
                      e.target.value === 'all' ? 'all' : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-white/10 dark:bg-slate-950/45 dark:text-white"
                >
                  <option value="all">Todas las actividades</option>
                  {planilla.actividades.map(actividad => (
                    <option key={actividad.id} value={actividad.id}>
                      {actividad.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botón Nueva Actividad */}
            {isDocente && (
              <div className="flex flex-col justify-stretch gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={handleExportarPlanilla}
                  className="w-full rounded-2xl border-slate-200 bg-white px-5 py-3 font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 sm:w-auto"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Exportar CSV
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingActividad(null);
                    setIsModalOpen(true);
                  }}
                  className="w-full rounded-2xl border-none bg-emerald-400 px-5 py-3 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300 sm:w-auto"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nueva Actividad
                </Button>
              </div>
            )}

            {/* Con varias actividades a la vez, la tabla necesita mucho
                ancho para no recortar los controles de calificacion; debajo
                de xl se muestra un alumno por tarjeta en su lugar. */}
            <div className="grid gap-4 xl:hidden">
              {paginatedAlumnos.map(alumno => (
                <article
                  key={alumno.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/95"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/materia/${materiaId}/alumno/${alumno.id}/historial${
                          selectedCursadaId
                            ? `?cursadaId=${selectedCursadaId}`
                            : ''
                        }`}
                        className="break-words font-bold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                      >
                        {getNombreCompleto(alumno)}
                      </Link>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {alumno.comision.nombre}
                      </p>
                    </div>
                  </div>

                  <label className="mb-4 block">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Gitea
                    </span>
                    <div className="mt-1">
                      {isDocente ? (
                        <input
                          type="text"
                          value={alumno.githubUser || ''}
                          onChange={e => {
                            setPlanilla(prev => {
                              if (!prev) return prev;
                              return {
                                ...prev,
                                alumnos: prev.alumnos.map(a =>
                                  a.id === alumno.id
                                    ? { ...a, githubUser: e.target.value }
                                    : a
                                ),
                              };
                            });
                          }}
                          onBlur={async e => {
                            const newValue = e.target.value.trim();
                            try {
                              await usuarioService.actualizarGithubUser(
                                alumno.id,
                                newValue
                              );
                            } catch (err) {
                              console.error('Error updating Gitea user:', err);
                              alert('Error al actualizar el usuario de Gitea');
                            }
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-950 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                          placeholder="usuario-gitea"
                        />
                      ) : alumno.githubUser ? (
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                          {alumno.githubUser}
                        </code>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          Sin usuario
                        </span>
                      )}
                      {renderGiteaSummary(alumno)}
                    </div>
                  </label>

                  <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
                    {filteredActividades.map(actividad => {
                      const key = getCellKey(alumno.id, actividad.id);
                      const isSaving = savingCells.has(key);
                      const appliesToAlumno = activityAppliesToComision(
                        actividad,
                        alumno.comision.id
                      );

                      return (
                        <div key={actividad.id}>
                          <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {actividad.nombre}
                            <span className="ml-1.5 font-semibold normal-case text-slate-400 dark:text-slate-500">
                              (
                              {actividad.tipoCalificacion === 'numerico'
                                ? 'Numérico'
                                : 'Conceptual'}
                              )
                            </span>
                          </p>
                          <div className="mt-1.5">
                            {!appliesToAlumno ? (
                              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                No asignada a esta comision
                              </span>
                            ) : (
                              <ActividadEntregaCell
                                alumno={alumno}
                                actividad={actividad}
                                isDocente={isDocente}
                                isSaving={isSaving}
                                getEntregaValue={getEntregaValue}
                                onCellChange={handleCellChange}
                                onSaveCell={handleSaveCell}
                                onOpenComentario={handleOpenComentarioModal}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>

            {/* Tabla de seguimiento */}
            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-950/95 xl:block">
              <div className="overflow-x-auto">
                <table className="min-w-[820px] w-full">
                  <thead className="bg-slate-100 dark:bg-slate-900">
                    <tr>
                      <th className="sticky left-0 z-20 bg-slate-100 px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:px-4">
                        Nombre completo
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-100 sm:px-4">
                        Comisión
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-100 sm:px-4">
                        Gitea
                      </th>

                      {/* Columnas dinámicas de actividades */}
                      {filteredActividades.map(actividad => (
                        <th
                          key={actividad.id}
                          className="min-w-[230px] px-3 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-100 sm:min-w-[250px] sm:px-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1 text-left">
                              {actividad.nombre}
                              <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                                {actividad.tipoCalificacion === 'numerico'
                                  ? 'Numérico (0-10)'
                                  : 'Conceptual'}
                              </div>
                              <div className="mt-1 text-xs font-semibold normal-case text-slate-500 dark:text-slate-300">
                                {actividad.comisiones?.length
                                  ? actividad.comisiones
                                      .map(comision => comision.nombre)
                                      .join(', ')
                                  : 'Todas las comisiones'}
                              </div>
                            </div>
                            {isDocente && (
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  onClick={() =>
                                    handleEditarActividad(actividad)
                                  }
                                  className="rounded p-1 text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-300/10"
                                  title="Editar actividad"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleEliminarActividad(
                                      actividad.id,
                                      actividad.nombre
                                    )
                                  }
                                  className="rounded p-1 text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
                                  title="Eliminar actividad"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-slate-950">
                    {paginatedAlumnos.map(alumno => (
                      <tr
                        key={alumno.id}
                        className="transition-colors hover:bg-emerald-50/60 dark:hover:bg-slate-900"
                      >
                        <td className="sticky left-0 z-10 bg-white px-3 py-3 text-sm font-bold text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-4">
                          <Link
                            to={`/materia/${materiaId}/alumno/${alumno.id}/historial${
                              selectedCursadaId
                                ? `?cursadaId=${selectedCursadaId}`
                                : ''
                            }`}
                            className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                          >
                            {getNombreCompleto(alumno)}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:px-4">
                          {alumno.comision.nombre}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700 dark:text-slate-200 sm:px-4">
                          {isDocente ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={alumno.githubUser || ''}
                                onChange={e => {
                                  // Update local state immediately
                                  setPlanilla(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      alumnos: prev.alumnos.map(a =>
                                        a.id === alumno.id
                                          ? { ...a, githubUser: e.target.value }
                                          : a
                                      ),
                                    };
                                  });
                                }}
                                onBlur={async e => {
                                  const newValue = e.target.value.trim();
                                  try {
                                    await usuarioService.actualizarGithubUser(
                                      alumno.id,
                                      newValue
                                    );
                                  } catch (err) {
                                    console.error(
                                      'Error updating Gitea user:',
                                      err
                                    );
                                    alert(
                                      'Error al actualizar el usuario de Gitea'
                                    );
                                  }
                                }}
                                className="w-full min-w-[150px] rounded-xl border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-950 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                                placeholder="usuario-gitea"
                              />
                            </div>
                          ) : alumno.githubUser ? (
                            <code className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                              {alumno.githubUser}
                            </code>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                              Sin usuario
                            </span>
                          )}
                          {renderGiteaSummary(alumno)}
                        </td>

                        {/* Celdas de entregas */}
                        {filteredActividades.map(actividad => {
                          const key = getCellKey(alumno.id, actividad.id);
                          const isSaving = savingCells.has(key);
                          const appliesToAlumno = activityAppliesToComision(
                            actividad,
                            alumno.comision.id
                          );

                          return (
                            <td
                              key={actividad.id}
                              className="border-l border-slate-200 px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200 sm:px-4"
                            >
                              {!appliesToAlumno ? (
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                  No asignada a esta comision
                                </span>
                              ) : (
                                <ActividadEntregaCell
                                  alumno={alumno}
                                  actividad={actividad}
                                  isDocente={isDocente}
                                  isSaving={isSaving}
                                  getEntregaValue={getEntregaValue}
                                  onCellChange={handleCellChange}
                                  onSaveCell={handleSaveCell}
                                  onOpenComentario={handleOpenComentarioModal}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginacion: comun a la vista de tarjetas y a la tabla,
                ambas recortan sobre el mismo paginatedAlumnos. */}
            {filteredAlumnos.length > studentsPerPage && (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Mostrando {(visiblePage - 1) * studentsPerPage + 1}–
                  {Math.min(
                    visiblePage * studentsPerPage,
                    filteredAlumnos.length
                  )}{' '}
                  de {filteredAlumnos.length} alumnos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={visiblePage === 1}
                    onClick={() =>
                      setCurrentPage(page => Math.max(1, page - 1))
                    }
                    className="rounded-xl px-4 py-2"
                  >
                    Anterior
                  </Button>
                  <span className="min-w-20 text-center text-sm font-bold text-slate-700 dark:text-slate-200">
                    {visiblePage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={visiblePage === totalPages}
                    onClick={() =>
                      setCurrentPage(page => Math.min(totalPages, page + 1))
                    }
                    className="rounded-xl px-4 py-2"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}

            {/* Modal para crear actividad */}
            <ActividadFormModal
              isOpen={isModalOpen}
              onClose={handleCerrarActividadModal}
              onSave={handleGuardarActividad}
              actividad={editingActividad}
              comisiones={comisiones}
            />

            {/* Modal para editar comentarios */}
            {comentarioModal && (
              <ComentarioModal
                isOpen={comentarioModal.isOpen}
                onClose={() => setComentarioModal(null)}
                onSave={handleSaveComentario}
                comentario={
                  String(
                    getEntregaValue(
                      planilla!.alumnos.find(
                        a => a.id === comentarioModal.alumnoId
                      )!,
                      planilla!.actividades.find(
                        a => a.id === comentarioModal.actividadId
                      )!,
                      'comentario'
                    )
                  ) || ''
                }
                alumnoNombre={comentarioModal.alumnoNombre}
                actividadNombre={comentarioModal.actividadNombre}
                readOnly={!isDocente}
              />
            )}
          </div>
        </div>
      )}
    </MateriaAccessGuard>
  );
};

export default PlanillaSeguimientoPage;
