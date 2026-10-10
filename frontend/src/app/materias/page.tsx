import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { MateriaModal } from '../../components/MateriaModal';
import { GestionarProfesoresModal } from '../../components/GestionarProfesoresModal';
import { ImportGiteaStudentsModal } from '../../components/admin/ImportGiteaStudentsModal';
import { apiService } from '../../shared/services/api.service';
import { ThemeToggle } from '../../shared/components/ThemeToggle';
import {
  BookOpen,
  Plus,
  Edit,
  LogOut,
  Users,
  LogIn,
  ArrowRight,
  Layers3,
  Sparkles,
  Code2,
  Database,
  GitBranch,
  Cloud,
  Shield,
  FileSpreadsheet,
  Gauge,
  CalendarDays,
  Search,
  ChevronDown,
  ChartNoAxesCombined,
  Archive,
  ArchiveRestore,
  LifeBuoy,
} from 'lucide-react';
import { PageTransition } from '../../components/PageTransition';

interface Materia {
  id?: number;
  codigo: string;
  nombre: string;
  archivada?: boolean;
  archivadaEn?: string | null;
  archivadaPor?: string | null;
}

const formatearFechaArchivado = (fecha?: string | null) => {
  if (!fecha) return null;
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const cardSymbols = ['</>', '{}', 'API', '$', 'git'];

const MateriasPage: React.FC = () => {
  const { authenticated, auth, userInfo, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isGestionarProfesoresModalOpen, setIsGestionarProfesoresModalOpen] =
    useState(false);
  const [isImportGiteaModalOpen, setIsImportGiteaModalOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [materiasArchivadas, setMateriasArchivadas] = useState<Materia[]>([]);
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [archivandoId, setArchivandoId] = useState<number | null>(null);

  const isDocente = auth?.hasRealmRole('docente') ?? false;
  const isAdmin = auth?.hasRealmRole('admin') ?? false;

  useEffect(() => {
    if (!isInitialized) return;

    const fetchMaterias = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: any = await apiService.get('/materia');
        const materiasData = Array.isArray(response) ? response : response.data;
        setMaterias(materiasData || []);

        if (authenticated && isAdmin) {
          try {
            const archivadas: any = await apiService.get('/materia/archivadas');
            setMateriasArchivadas(
              Array.isArray(archivadas) ? archivadas : archivadas?.data || []
            );
          } catch (archivadasError) {
            console.error(
              'Error fetching materias archivadas:',
              archivadasError
            );
          }
        } else {
          setMateriasArchivadas([]);
        }
      } catch (err) {
        console.error('Error fetching materias:', err);
        setError('No se pudieron cargar las materias');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterias();
  }, [isInitialized, authenticated, isDocente, isAdmin]);

  const handleMateriaClick = (materia: Materia) => {
    if (!materia.id) return;

    if (!authenticated) {
      auth?.login(`/materia/${materia.id}`);
      return;
    }

    navigate(`/materia/${materia.id}`);
  };

  const handleLogout = () => {
    auth?.logout();
  };

  const handleLogin = () => {
    auth?.login('/materias');
  };

  const handleVerMaterias = () => {
    document
      .getElementById('materias-list')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateMateria = () => {
    setIsAdminMenuOpen(false);
    setSelectedMateria(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditMateria = (materia: Materia, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMateria(materia);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleGestionarProfesores = (materia: Materia, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMateria(materia);
    setIsGestionarProfesoresModalOpen(true);
  };

  const handleSaveMateria = async (materiaData: Materia) => {
    const payload = {
      codigo: materiaData.codigo,
      nombre: materiaData.nombre,
    };

    try {
      if (modalMode === 'create') {
        const newMateria = await apiService.post<Materia>('/materia', payload);
        setMaterias(prev => [...prev, newMateria as Materia]);
      } else if (selectedMateria?.id) {
        const updatedMateria = await apiService.put<Materia>(
          `/materia/${selectedMateria.id}`,
          payload
        );
        setMaterias(prev =>
          prev.map(m =>
            m.id === selectedMateria.id ? (updatedMateria as Materia) : m
          )
        );
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al guardar materia:', error);
      throw error;
    }
  };

  const handleArchivarMateria = async (id: number) => {
    setArchivandoId(id);
    try {
      const archivada = await apiService.patch<Materia>(
        `/materia/${id}/archivar`,
        {}
      );
      setMaterias(prev => prev.filter(m => m.id !== id));
      setMateriasArchivadas(prev => [archivada as Materia, ...prev]);
    } catch (error) {
      console.error('Error al archivar materia:', error);
      throw error;
    } finally {
      setArchivandoId(null);
    }
  };

  const handleDesarchivarMateria = async (id: number) => {
    setArchivandoId(id);
    try {
      const materia = await apiService.patch<Materia>(
        `/materia/${id}/desarchivar`,
        {}
      );
      setMateriasArchivadas(prev => prev.filter(m => m.id !== id));
      setMaterias(prev => [...prev, materia as Materia]);
    } catch (error) {
      console.error('Error al desarchivar materia:', error);
      setError('No se pudo desarchivar la materia');
    } finally {
      setArchivandoId(null);
    }
  };

  const handleDeleteMateria = async (id: number) => {
    try {
      await apiService.delete(`/materia/${id}`);
      setMaterias(prev => prev.filter(m => m.id !== id));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al eliminar materia:', error);
      throw error;
    }
  };

  if (!isInitialized || loading) {
    return <LoadingSpinner fullScreen size="lg" label="Cargando materias..." />;
  }

  return (
    <PageTransition className="materia-page-shell">
      <div className="materia-page-gradient" />
      <div className="materia-page-grid" />

      <header className="relative z-50 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto grid max-w-screen-2xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/95 p-2 shadow-lg shadow-emerald-950/30 sm:h-16 sm:w-16">
              <img
                src="/images/LOGO.png"
                alt="Logo UNAHUR"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  UNAHUR
                </h1>
                <span className="materia-chip-primary max-w-full rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase leading-none sm:text-xs">
                  Materiales Tecnológicos
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                {authenticated && userInfo
                  ? `Bienvenido, ${userInfo.name || userInfo.username}`
                  : 'Materias disponibles'}
                {authenticated && isDocente && (
                  <span className="ml-2 font-semibold text-cyan-700 dark:text-cyan-200">
                    (Docente)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 min-[520px]:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] lg:flex lg:w-auto lg:flex-wrap lg:items-center lg:justify-end">
            {authenticated && (
              <>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-emerald-950/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 sm:px-4"
                  >
                    <Gauge className="h-4 w-4" />
                    <span>Dashboard</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('/calendario')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-emerald-950/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 sm:px-4"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>Calendario</span>
                </button>
                <button
                  onClick={() => navigate('/buscar')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-emerald-950/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 sm:px-4"
                >
                  <Search className="h-4 w-4" />
                  <span>Buscar</span>
                </button>
              </>
            )}
            {authenticated && isAdmin && (
              <div className="relative contents lg:block">
                <button
                  type="button"
                  onClick={() => setIsAdminMenuOpen(prev => !prev)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-emerald-950/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 sm:px-4"
                  aria-expanded={isAdminMenuOpen}
                >
                  <Users className="h-4 w-4" />
                  <span>Admin</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isAdminMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isAdminMenuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Cerrar menu admin"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setIsAdminMenuOpen(false)}
                    />
                    <div className="fixed left-4 right-4 top-36 z-50 max-h-[calc(100vh-10rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900 dark:shadow-slate-950/35 sm:left-auto sm:w-80 lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-2 lg:max-h-none">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          handleCreateMateria();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                      >
                        <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        Nueva materia
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          navigate('/admin/solicitudes');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                      >
                        <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                        Solicitudes docentes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          navigate('/admin/usuarios');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                      >
                        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                        Usuarios
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          navigate('/admin/estadisticas');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                      >
                        <ChartNoAxesCombined className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                        Estadísticas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          navigate('/admin/reportes');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                      >
                        <LifeBuoy className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                        Reportes de usuarios
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          setIsImportGiteaModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        Importar alumnos a Gitea
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <ThemeToggle className="justify-self-center lg:justify-self-auto" />
            {authenticated ? (
              <button
                onClick={handleLogout}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white sm:px-4"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:text-white sm:px-4"
              >
                <LogIn className="h-4 w-4" />
                <span>Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="tech-hero mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:shadow-slate-950/30 sm:mb-8 sm:rounded-[2rem]">
            <div className="tech-hero-ambient" aria-hidden="true">
              <div className="tech-code-line tech-code-line-1">
                const materias = await api.get("/materias");
              </div>
              <div className="tech-code-line tech-code-line-2">
                git commit -m "avance de cursada";
              </div>
              <div className="tech-code-line tech-code-line-3">
                docker compose up;
              </div>
              <div className="tech-code-line tech-code-line-4">
                SELECT * FROM materias;
              </div>
              <div className="tech-node tech-node-a" />
              <div className="tech-node tech-node-b" />
              <div className="tech-node tech-node-c" />
              <div className="tech-node tech-node-d" />
              <div className="tech-link tech-link-a" />
              <div className="tech-link tech-link-b" />
              <div className="tech-data-stream tech-data-stream-a" />
              <div className="tech-data-stream tech-data-stream-b" />
            </div>

            <div className="relative z-10 grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:p-10">
              <div className="max-w-3xl">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Campus tecnológico
                </p>
                <h2 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Mis materias
                </h2>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    onClick={handleVerMaterias}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-100 sm:w-auto sm:min-w-52"
                  >
                    <Layers3 className="h-4 w-4" />
                    Ver materias
                  </button>
                </div>
              </div>

              <div className="tech-hero-scene" aria-hidden="true">
                <div className="tech-terminal-window">
                  <div className="tech-window-controls">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="tech-terminal-lines">
                    <span>$ npm run campus</span>
                    <span>&gt; cargando materias...</span>
                    <span>&gt; prompt: resumir conceptos</span>
                    <span>&gt; validando acceso</span>
                    <span className="tech-cursor-line">agent.learn()</span>
                  </div>
                </div>

                <div className="tech-floating-card tech-card-code">
                  <Code2 className="h-6 w-6" />
                  <span>&lt;/&gt;</span>
                </div>
                <div className="tech-floating-card tech-card-git">
                  <GitBranch className="h-6 w-6" />
                  <span>Git</span>
                </div>
                <div className="tech-floating-card tech-card-db">
                  <Database className="h-6 w-6" />
                  <span>SQL</span>
                </div>
                <div className="tech-floating-card tech-card-cloud">
                  <Cloud className="h-6 w-6" />
                  <span>Cloud</span>
                </div>
                <div className="tech-floating-card tech-card-sec">
                  <Shield className="h-6 w-6" />
                  <span>Auth</span>
                </div>
                <div className="tech-editor-panel">
                  <div className="h-2 w-20 rounded-full bg-cyan-300/70" />
                  <div className="h-2 w-32 rounded-full bg-white/35" />
                  <div className="h-2 w-24 rounded-full bg-violet-300/60" />
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800 dark:bg-red-900/20">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {materias.length > 0 ? (
            <div
              id="materias-list"
              className="grid scroll-mt-8 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {materias.map((materia, index) => {
                const cardSymbol = cardSymbols[index % cardSymbols.length];

                return (
                  <article
                    key={materia.id}
                    onClick={() => handleMateriaClick(materia)}
                    className="materia-tech-card group flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl shadow-slate-950/10 transition-all duration-300 hover:border-cyan-200 hover:shadow-2xl hover:shadow-cyan-950/15 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-slate-950/30 dark:hover:border-cyan-300/40 sm:min-h-[310px]"
                  >
                    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc,#ffffff_48%,#eef2ff)] px-6 py-8 text-center dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(15,23,42,0.92)_52%,rgba(30,41,59,0.96))]">
                      <div className="pointer-events-none absolute inset-0 opacity-70">
                        <div className="absolute right-6 top-8 font-mono text-6xl font-black text-slate-100 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 dark:text-white/5">
                          {cardSymbol}
                        </div>
                        <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-400/10" />
                        <div className="absolute -right-8 bottom-4 h-24 w-24 rounded-full bg-violet-200/35 blur-3xl dark:bg-violet-400/10" />
                        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/35 to-violet-400/0" />
                      </div>
                      {authenticated && isAdmin && (
                        <div className="absolute right-4 top-4 flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                          <button
                            type="button"
                            onPointerDown={e => e.stopPropagation()}
                            onMouseDown={e => e.stopPropagation()}
                            onClick={e => handleGestionarProfesores(materia, e)}
                            className="relative z-30 rounded-xl border border-slate-200 bg-white/90 p-2 text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-emerald-700 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:text-emerald-200"
                            title="Gestionar profesores"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onPointerDown={e => e.stopPropagation()}
                            onMouseDown={e => e.stopPropagation()}
                            onClick={e => handleEditMateria(materia, e)}
                            className="relative z-30 rounded-xl border border-slate-200 bg-white/90 p-2 text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:text-cyan-200"
                            title="Editar materia"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <div className="relative mb-5 flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-slate-950 text-cyan-300 shadow-xl shadow-slate-950/20 transition-transform duration-300 group-hover:scale-105 dark:border-white/10 dark:bg-white dark:text-slate-950">
                          <BookOpen className="h-7 w-7 text-cyan-500 dark:text-cyan-300" />
                        </div>
                      </div>
                      <h3 className="overflow-wrap-anywhere relative max-w-full text-balance text-xl font-black leading-tight text-slate-950 dark:text-white sm:text-2xl">
                        {materia.nombre}
                      </h3>
                      <span className="relative mt-4 inline-flex max-w-full rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-sm font-black text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
                        {materia.codigo}
                      </span>
                    </div>

                    <div className="flex justify-center bg-white/85 p-5 backdrop-blur dark:bg-slate-950/35">
                      <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation();
                          handleMateriaClick(materia);
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cyan-950/20 group-hover:bg-cyan-300 group-hover:text-slate-950 dark:bg-white dark:text-slate-950 dark:shadow-slate-950/30 dark:group-hover:bg-cyan-300 sm:w-auto"
                      >
                        {authenticated ? 'Ver materia' : 'Ingresar'}
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white/95 py-14 text-center shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900/90">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                <BookOpen className="h-12 w-12" />
              </div>
              <h3 className="mb-2 text-xl font-black text-slate-800 dark:text-slate-100">
                No hay materias disponibles
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Cuando se creen materias, van a aparecer en este listado.
              </p>
            </div>
          )}

          {authenticated && isAdmin && materiasArchivadas.length > 0 && (
            <section className="mt-10 rounded-3xl border border-amber-200/80 bg-amber-50/70 p-5 shadow-lg shadow-amber-950/5 dark:border-amber-300/20 dark:bg-amber-500/5 sm:p-6">
              <button
                type="button"
                onClick={() => setMostrarArchivadas(prev => !prev)}
                aria-expanded={mostrarArchivadas}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-600 shadow-sm dark:border-amber-300/20 dark:bg-slate-950/60 dark:text-amber-200">
                    <Archive className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-black text-slate-900 dark:text-white">
                      Materias archivadas ({materiasArchivadas.length})
                    </span>
                    <span className="block text-sm text-slate-600 dark:text-slate-300">
                      Conservan todo su contenido y solo las ves como
                      administrador.
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-300 ${
                    mostrarArchivadas ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mostrarArchivadas && (
                <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {materiasArchivadas.map(materia => {
                    const fecha = formatearFechaArchivado(materia.archivadaEn);

                    return (
                      <li
                        key={materia.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="overflow-wrap-anywhere font-black text-slate-900 dark:text-white">
                            {materia.nombre}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            {materia.codigo}
                          </p>
                          {fecha && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Archivada el {fecha}
                              {materia.archivadaPor
                                ? ` por ${materia.archivadaPor}`
                                : ''}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            materia.id && handleDesarchivarMateria(materia.id)
                          }
                          disabled={archivandoId === materia.id}
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-300/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                          {archivandoId === materia.id
                            ? 'Desarchivando...'
                            : 'Desarchivar'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>

      <MateriaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMateria}
        onDelete={handleDeleteMateria}
        onArchive={isAdmin ? handleArchivarMateria : undefined}
        materia={selectedMateria}
        mode={modalMode}
      />

      <GestionarProfesoresModal
        isOpen={isGestionarProfesoresModalOpen}
        onClose={() => setIsGestionarProfesoresModalOpen(false)}
        materiaId={selectedMateria?.id || 0}
        materiaNombre={selectedMateria?.nombre || ''}
      />

      <ImportGiteaStudentsModal
        open={isImportGiteaModalOpen}
        onClose={() => setIsImportGiteaModalOpen(false)}
      />
    </PageTransition>
  );
};

export default MateriasPage;
