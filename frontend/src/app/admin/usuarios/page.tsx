import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  HeartPulse,
  KeyRound,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserPlus,
  UserRoundX,
  Users,
  X,
} from 'lucide-react';
import {
  AdminAuditLog,
  AdminEstadoTecnico,
  AdminMetricas,
  AlumnoMateria,
  GiteaAdminUser,
  MaintenanceStatus,
  MateriaResumen,
  ProfesorMateria,
  UnifiedAdminUserRow,
  Usuario,
  usuarioService,
} from '../../../services/usuario.service';
import { useAuth } from '../../auth/contexts/AuthContext';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorComponent } from '../../../components/ErrorComponent';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Button } from '../../../shared/design-system/components/Button';
import { PageTransition } from '../../../components/PageTransition';
import { useConfirm, useToast } from '../../../hooks';
import AuthStatus from '../../../components/AuthStatus';
import { getApiErrorMessage } from '../../../utils/api-error';

type Tab = 'usuarios' | 'auditoria' | 'estado';
type StatusFilter = 'todos' | 'activo' | 'suspendido';
type UnifiedUserRow = UnifiedAdminUserRow;

const DEFAULT_USERS_PER_PAGE = 10;

const roleLabels: Record<Usuario['rol'], string> = {
  alumno: 'Alumno',
  docente: 'Docente',
  admin: 'Admin',
};

const actionLabels: Record<AdminAuditLog['action'], string> = {
  user_role_updated: 'Rol actualizado',
  user_suspended: 'Usuario suspendido',
  user_reactivated: 'Usuario reactivado',
  user_deleted: 'Usuario eliminado',
  user_teacher_assigned: 'Docencia asignada',
  user_teacher_removed: 'Docencia removida',
  maintenance_updated: 'Mantenimiento actualizado',
  materia_created: 'Materia creada',
  materia_updated: 'Materia actualizada',
  materia_deleted: 'Materia eliminada',
  materia_restored: 'Materia restaurada',
  materia_archived: 'Materia archivada',
  materia_unarchived: 'Materia desarchivada',
  student_enrollment_updated: 'Inscripcion actualizada',
  delivery_updated: 'Entrega actualizada',
  gitea_import_executed: 'Importacion ejecutada',
  student_list_exported: 'Listado de alumnos exportado',
  gitea_password_updated: 'Contraseña de Gitea actualizada',
};

export default function AdminUsuariosPage() {
  const [items, setItems] = useState<UnifiedUserRow[]>([]);
  const [usuariosTotal, setUsuariosTotal] = useState(0);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [usuariosError, setUsuariosError] = useState<string | null>(null);
  const usersRequestId = useRef(0);
  const [giteaTotal, setGiteaTotal] = useState(0);
  const [giteaError, setGiteaError] = useState<string | null>(null);
  const [giteaSyncedAt, setGiteaSyncedAt] = useState<string | null>(null);
  const [giteaPasswordUser, setGiteaPasswordUser] =
    useState<GiteaAdminUser | null>(null);
  const [giteaProcessingUser, setGiteaProcessingUser] = useState<string | null>(
    null
  );
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [metricas, setMetricas] = useState<AdminMetricas | null>(null);
  const [estadoTecnico, setEstadoTecnico] = useState<AdminEstadoTecnico | null>(
    null
  );
  const [maintenance, setMaintenance] = useState<MaintenanceStatus | null>(
    null
  );
  const [materias, setMaterias] = useState<MateriaResumen[]>([]);
  const [docencias, setDocencias] = useState<Record<number, ProfesorMateria[]>>(
    {}
  );
  const [selectedMateria, setSelectedMateria] = useState<
    Record<number, string>
  >({});
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [platformPage, setPlatformPage] = useState(1);
  const [platformPageSize, setPlatformPageSize] = useState(
    DEFAULT_USERS_PER_PAGE
  );
  const [roleFilter, setRoleFilter] = useState<'todos' | Usuario['rol']>(
    'todos'
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { auth, isInitialized, userInfo } = useAuth();
  const isAdmin = auth?.hasRealmRole('admin') ?? false;
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmState, confirm } = useConfirm();

  const loadAudit = useCallback(async () => {
    setAuditLogs(await usuarioService.obtenerAuditoriaAdmin(150));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        auditData,
        metricasData,
        estadoData,
        materiasData,
        maintenanceData,
      ] = await Promise.all([
        usuarioService.obtenerAuditoriaAdmin(150),
        usuarioService.obtenerMetricasAdmin(),
        usuarioService.obtenerEstadoTecnico(),
        usuarioService.obtenerMateriasDisponibles(),
        usuarioService.obtenerMaintenanceStatus(),
      ]);

      setAuditLogs(auditData);
      setMetricas(metricasData);
      setEstadoTecnico(estadoData);
      setMaterias(materiasData);
      setMaintenance(maintenanceData);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Error al cargar la administracion';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // El listado de usuarios se pide aparte (y se vuelve a pedir en cada
  // cambio de pagina/filtro): a diferencia del resto del contexto de admin,
  // esto viaja paginado desde el servidor en vez de traer siempre todo.
  const loadUsuariosPage = useCallback(
    async (refreshGitea = false, manual = false) => {
      const requestId = ++usersRequestId.current;
      setUsuariosLoading(true);
      setUsuariosError(null);
      try {
        const response = await usuarioService.obtenerUsuariosAdmin({
          page: platformPage,
          limit: platformPageSize,
          search: debouncedQuery,
          rol: roleFilter,
          estado: statusFilter,
          refreshGitea,
        });
        if (requestId !== usersRequestId.current) return;
        setItems(response.items);
        setUsuariosTotal(response.total);
        setGiteaTotal(response.gitea?.total || 0);
        setGiteaSyncedAt(response.gitea?.syncedAt || null);
        setGiteaError(response.gitea?.error || null);
        if (manual) {
          if (response.gitea?.error) toast.error(response.gitea.error);
          else toast.success('Usuarios actualizados');
        }
        setDocencias(prev => {
          const next = { ...prev };
          for (const row of response.items) {
            if (row.platformUser) {
              next[row.platformUser.id] =
                row.platformUser.materiasProfesor || [];
            }
          }
          return next;
        });
        // Si un filtro dejo la pagina actual fuera de rango (por ejemplo,
        // se elimino el ultimo usuario de la ultima pagina), se vuelve a la
        // ultima pagina valida.
        const totalPages = Math.max(
          1,
          Math.ceil(response.total / platformPageSize)
        );
        if (platformPage > totalPages) setPlatformPage(totalPages);
      } catch (err: any) {
        if (requestId !== usersRequestId.current) return;
        const message = getApiErrorMessage(
          err,
          'No se pudieron cargar los usuarios'
        );
        setUsuariosError(message);
        toast.error(message);
      } finally {
        if (requestId === usersRequestId.current) setUsuariosLoading(false);
      }
    },
    [
      debouncedQuery,
      platformPage,
      platformPageSize,
      roleFilter,
      statusFilter,
      toast,
    ]
  );

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAdmin) {
      navigate('/materias');
      return;
    }
    void loadData();
  }, [isAdmin, isInitialized, loadData, navigate]);

  useEffect(() => {
    if (!isInitialized || !isAdmin) return;
    void loadUsuariosPage();
    const intervalId = window.setInterval(
      () => void loadUsuariosPage(),
      5 * 60 * 1000
    );
    return () => {
      usersRequestId.current++;
      window.clearInterval(intervalId);
    };
  }, [isAdmin, isInitialized, loadUsuariosPage]);

  // Espera a que el usuario deje de tipear antes de pedir al servidor.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 350);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    setPlatformPage(1);
  }, [debouncedQuery, roleFilter, statusFilter]);

  const refreshAdminContext = async () => {
    const [auditData, metricasData, estadoData] = await Promise.all([
      usuarioService.obtenerAuditoriaAdmin(150),
      usuarioService.obtenerMetricasAdmin(),
      usuarioService.obtenerEstadoTecnico(),
    ]);
    setAuditLogs(auditData);
    setMetricas(metricasData);
    setEstadoTecnico(estadoData);
  };

  const refreshDocencias = async (usuarioId: number) => {
    const data = await usuarioService.obtenerDocenciasUsuario(usuarioId);
    setDocencias(prev => ({ ...prev, [usuarioId]: data }));
  };

  const handleRoleChange = async (usuario: Usuario, rol: Usuario['rol']) => {
    if (usuario.rol === rol) return;
    setProcessingId(usuario.id);
    try {
      await usuarioService.actualizarRolUsuario(usuario.id, rol);
      await Promise.all([loadUsuariosPage(), refreshAdminContext()]);
      toast.success('Rol actualizado');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'No se pudo actualizar el rol'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspend = async (usuario: Usuario) => {
    const motivo = window.prompt(
      `Motivo de suspension para ${usuario.nombre} ${usuario.apellido}:`
    );
    if (motivo === null) return;
    setProcessingId(usuario.id);
    try {
      await usuarioService.suspenderUsuario(usuario.id, motivo);
      await Promise.all([loadUsuariosPage(), refreshAdminContext()]);
      toast.success('Usuario suspendido');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo suspender');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReactivate = async (usuario: Usuario) => {
    setProcessingId(usuario.id);
    try {
      await usuarioService.reactivarUsuario(usuario.id);
      await Promise.all([loadUsuariosPage(), refreshAdminContext()]);
      toast.success('Usuario reactivado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo reactivar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (usuario: Usuario) => {
    const name =
      `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() ||
      usuario.email;
    const confirmed = await confirm({
      title: 'Eliminar usuario definitivamente',
      message: `Se eliminará a ${name} de la plataforma${usuario.githubUser ? ` y también la cuenta ${usuario.githubUser} de Gitea` : ''}. Se perderán sus inscripciones, entregas y repositorios asociados. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar definitivamente',
      variant: 'danger',
    });
    if (!confirmed) return;

    setProcessingId(usuario.id);
    try {
      await usuarioService.eliminarUsuario(usuario.id);
      setDocencias(prev => {
        const next = { ...prev };
        delete next[usuario.id];
        return next;
      });
      await Promise.all([loadUsuariosPage(true), refreshAdminContext()]);
      toast.success('Usuario eliminado de la plataforma y Gitea');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'No se pudo eliminar el usuario'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignTeacher = async (usuario: Usuario) => {
    const materiaId = Number(selectedMateria[usuario.id]);
    if (!materiaId) {
      toast.error('Selecciona una materia');
      return;
    }

    setProcessingId(usuario.id);
    try {
      await usuarioService.asignarDocenciaUsuario(usuario.id, materiaId);
      await refreshDocencias(usuario.id);
      await refreshAdminContext();
      setSelectedMateria(prev => ({ ...prev, [usuario.id]: '' }));
      toast.success('Docencia asignada');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo asignar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveTeacher = async (
    usuario: Usuario,
    docencia: ProfesorMateria
  ) => {
    setProcessingId(usuario.id);
    try {
      await usuarioService.quitarDocenciaUsuario(
        usuario.id,
        docencia.materiaId
      );
      await refreshDocencias(usuario.id);
      await refreshAdminContext();
      toast.success('Docencia removida');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo remover');
    } finally {
      setProcessingId(null);
    }
  };

  const handleGiteaPasswordUpdate = async (
    password: string,
    mustChangePassword: boolean
  ) => {
    if (!giteaPasswordUser) return;

    setGiteaProcessingUser(giteaPasswordUser.username);
    try {
      await usuarioService.actualizarPasswordGitea(
        giteaPasswordUser.username,
        password,
        mustChangePassword
      );
      toast.success(`Contraseña de ${giteaPasswordUser.username} actualizada`);
      setGiteaPasswordUser(null);
      await Promise.all([loadUsuariosPage(true), loadAudit()]);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'No se pudo actualizar la contraseña de Gitea';
      toast.error(message);
      throw new Error(message);
    } finally {
      setGiteaProcessingUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner label="Cargando administracion..." />
      </div>
    );
  }

  return (
    <PageTransition className="app-page">
      <div className="app-page-container max-w-7xl space-y-6">
        <header className="app-page-header">
          <div className="flex items-center gap-4">
            <Link
              to="/materias"
              className="app-icon-button"
              aria-label="Volver a materias"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="app-page-title">Administracion de usuarios</h1>
              <p className="app-page-description">
                Roles, docencias, estado de acceso y auditoria institucional.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/solicitudes">
              <Button variant="outline">Solicitudes docentes</Button>
            </Link>
            <AuthStatus alwaysShow={true} />
          </div>
        </header>

        {error ? (
          <ErrorComponent error={error} onRetry={loadData} />
        ) : (
          <>
            <MetricGrid metricas={metricas} />

            <div className="flex flex-col gap-4 border-b border-slate-200 pb-3 dark:border-white/10 min-[1900px]:flex-row min-[1900px]:items-end min-[1900px]:justify-between">
              <div className="flex max-w-full shrink-0 gap-1 overflow-x-auto overflow-y-hidden sm:gap-2 sm:overflow-visible">
                <TabButton
                  active={activeTab === 'usuarios'}
                  onClick={() => setActiveTab('usuarios')}
                  icon={<Users className="h-4 w-4" />}
                  label="Usuarios"
                />
                <TabButton
                  active={activeTab === 'auditoria'}
                  onClick={() => {
                    setActiveTab('auditoria');
                    void loadAudit();
                  }}
                  icon={<Activity className="h-4 w-4" />}
                  label="Auditoria"
                />
                <TabButton
                  active={activeTab === 'estado'}
                  onClick={() => setActiveTab('estado')}
                  icon={<HeartPulse className="h-4 w-4" />}
                  label="Estado"
                />
              </div>
              {activeTab === 'usuarios' && (
                <div className="grid w-full min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(260px,420px)_180px_180px_auto] xl:justify-end min-[1900px]:w-auto">
                  <label className="app-form-control flex min-w-0 items-center gap-2 px-3 sm:col-span-2 xl:col-span-1">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                      placeholder="Buscar por nombre, email o usuario de Gitea"
                    />
                  </label>
                  <select
                    value={roleFilter}
                    onChange={event =>
                      setRoleFilter(
                        event.target.value as 'todos' | Usuario['rol']
                      )
                    }
                    className="app-form-control py-2 text-sm font-semibold"
                  >
                    <option value="todos">Todos los roles</option>
                    {Object.entries(roleLabels).map(([rol, label]) => (
                      <option key={rol} value={rol}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={event =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="app-form-control py-2 text-sm font-semibold"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activos</option>
                    <option value="suspendido">Suspendidos</option>
                  </select>
                  <Button
                    variant="outline"
                    className="w-full whitespace-nowrap sm:col-span-2 xl:col-span-1"
                    onClick={() => void loadUsuariosPage(true, true)}
                    disabled={usuariosLoading}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${usuariosLoading ? 'animate-spin' : ''}`}
                    />
                    Consultar ahora
                  </Button>
                </div>
              )}
            </div>

            {activeTab === 'usuarios' && (
              <section className="space-y-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-slate-950 dark:text-white">
                      Usuarios
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Usuarios del campus y cuentas de Gitea en un único
                      listado. Las cuentas sin usuario local se indican como no
                      vinculadas.
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400 lg:text-right">
                    {usuariosLoading
                      ? 'Consultando usuarios…'
                      : giteaError
                        ? giteaError
                        : giteaSyncedAt
                          ? `${giteaTotal} cuentas Gitea · Actualizado ${formatLastAccess(giteaSyncedAt)}`
                          : ''}
                  </p>
                </div>
                {usuariosError && (
                  <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-700 dark:text-red-300"
                  >
                    <span>{usuariosError}</span>
                    <Button
                      variant="outline"
                      onClick={() => void loadUsuariosPage(true)}
                      disabled={usuariosLoading}
                    >
                      Reintentar
                    </Button>
                  </div>
                )}
                {items.length === 0 && usuariosLoading ? (
                  <LoadingSpinner label="Cargando usuarios..." />
                ) : items.length === 0 && !usuariosError ? (
                  <p className="app-surface p-6 text-center text-slate-500">
                    No se encontraron usuarios con estos filtros.
                  </p>
                ) : (
                  <div
                    className={
                      usuariosLoading ? 'opacity-60 transition-opacity' : ''
                    }
                  >
                    <UsersTable
                      rows={items}
                      materias={materias}
                      docencias={docencias}
                      selectedMateria={selectedMateria}
                      setSelectedMateria={setSelectedMateria}
                      processingId={processingId}
                      giteaProcessingUsername={giteaProcessingUser}
                      giteaAvailable={!giteaError && !!giteaSyncedAt}
                      currentEmail={userInfo?.email}
                      onRoleChange={handleRoleChange}
                      onSuspend={handleSuspend}
                      onReactivate={handleReactivate}
                      onDelete={handleDelete}
                      onAssignTeacher={handleAssignTeacher}
                      onRemoveTeacher={handleRemoveTeacher}
                      onChangeGiteaPassword={setGiteaPasswordUser}
                    />
                  </div>
                )}
                <PaginationControls
                  page={platformPage}
                  pageSize={platformPageSize}
                  totalItems={usuariosTotal}
                  onPageChange={setPlatformPage}
                  onPageSizeChange={pageSize => {
                    setPlatformPageSize(pageSize);
                    setPlatformPage(1);
                  }}
                />
              </section>
            )}

            {activeTab === 'auditoria' && <AuditList auditLogs={auditLogs} />}

            {activeTab === 'estado' && (
              <TechnicalStatus
                estado={estadoTecnico}
                maintenance={maintenance}
                setMaintenance={setMaintenance}
                onRefresh={loadData}
                refreshAudit={loadAudit}
              />
            )}
          </>
        )}
      </div>
      <ConfirmDialog {...confirmState} />
      {giteaPasswordUser && (
        <GiteaPasswordModal
          user={giteaPasswordUser}
          loading={giteaProcessingUser === giteaPasswordUser.username}
          onClose={() => setGiteaPasswordUser(null)}
          onSubmit={handleGiteaPasswordUpdate}
        />
      )}
    </PageTransition>
  );
}

function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginación de usuarios"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Mostrando {firstItem}-{lastItem} de {totalItems}
        </p>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Por página
          <select
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
          >
            {[10, 25, 50].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          Página
          <select
            value={page}
            onChange={event => onPageChange(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
            aria-label="Seleccionar página"
          >
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              pageNumber => (
                <option key={pageNumber} value={pageNumber}>
                  {pageNumber}
                </option>
              )
            )}
          </select>
          de {totalPages}
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

function GiteaAccountBadge({ user }: { user: GiteaAdminUser }) {
  const blocked = !user.active || user.prohibitLogin;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        blocked
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
      }`}
    >
      {blocked ? 'Acceso bloqueado' : 'Activa'}
    </span>
  );
}

function GiteaPasswordModal({
  user,
  loading,
  onClose,
  onSubmit,
}: {
  user: GiteaAdminUser;
  loading: boolean;
  onClose: () => void;
  onSubmit: (password: string, mustChangePassword: boolean) => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      await onSubmit(password, mustChangePassword);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cambiar la contraseña.');
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-3 sm:p-4">
      <button
        type="button"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
        aria-label="Cerrar"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gitea-password-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="gitea-password-title"
              className="text-xl font-black text-slate-950 dark:text-white"
            >
              Cambiar contraseña
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Cuenta Gitea: <strong>{user.username}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="app-icon-button"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Nueva contraseña
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              autoFocus
              className="app-form-control"
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Repetir contraseña
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className="app-form-control"
              required
            />
          </label>

          <label className="group relative flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={event => setShowPassword(event.target.checked)}
              className="peer absolute h-5 w-5 cursor-pointer opacity-0"
            />
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-500 bg-white text-transparent transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 dark:border-slate-400 dark:bg-slate-800 dark:peer-checked:border-blue-400 dark:peer-checked:bg-blue-500 dark:peer-checked:text-white dark:peer-focus-visible:ring-offset-slate-900">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            Mostrar contraseña
          </label>
          <label className="group relative flex cursor-pointer items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
            <input
              type="checkbox"
              checked={mustChangePassword}
              onChange={event => setMustChangePassword(event.target.checked)}
              className="peer absolute mt-0.5 h-5 w-5 cursor-pointer opacity-0"
            />
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-500 bg-white text-transparent transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 dark:border-slate-400 dark:bg-slate-800 dark:peer-checked:border-blue-400 dark:peer-checked:bg-blue-500 dark:peer-checked:text-white dark:peer-focus-visible:ring-offset-slate-900">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span>
              Exigir que el usuario cambie esta contraseña en su próximo
              ingreso.
            </span>
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            Guardar contraseña
          </Button>
        </div>
      </form>
    </div>
  );

  return createPortal(modal, document.body);
}

function MetricGrid({ metricas }: { metricas: AdminMetricas | null }) {
  const items = [
    ['Usuarios activos', metricas?.usuariosActivos ?? 0],
    ['Suspendidos', metricas?.usuariosSuspendidos ?? 0],
    ['Docentes pendientes', metricas?.docentesPendientes ?? 0],
    ['Materias activas', metricas?.materiasActivas ?? 0],
    ['Entregas recientes', metricas?.entregasRecientes ?? 0],
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(([label, value]) => (
        <article key={label} className="app-surface p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
            {value}
          </p>
        </article>
      ))}
    </section>
  );
}

function UsersTable({
  rows,
  materias,
  docencias,
  selectedMateria,
  setSelectedMateria,
  processingId,
  giteaProcessingUsername,
  giteaAvailable,
  currentEmail,
  onRoleChange,
  onSuspend,
  onReactivate,
  onDelete,
  onAssignTeacher,
  onRemoveTeacher,
  onChangeGiteaPassword,
}: {
  rows: UnifiedUserRow[];
  materias: MateriaResumen[];
  docencias: Record<number, ProfesorMateria[]>;
  selectedMateria: Record<number, string>;
  setSelectedMateria: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  processingId: number | null;
  giteaProcessingUsername: string | null;
  giteaAvailable: boolean;
  currentEmail?: string;
  onRoleChange: (usuario: Usuario, rol: Usuario['rol']) => void;
  onSuspend: (usuario: Usuario) => void;
  onReactivate: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
  onAssignTeacher: (usuario: Usuario) => void;
  onRemoveTeacher: (usuario: Usuario, docencia: ProfesorMateria) => void;
  onChangeGiteaPassword: (user: GiteaAdminUser) => void;
}) {
  return (
    <div className="app-table-shell">
      <div className="grid gap-4 p-3 lg:grid-cols-2 xl:hidden">
        {rows.map(row => {
          const usuario = row.platformUser;
          const giteaUser = row.giteaUser;

          if (!usuario && giteaUser) {
            return (
              <GiteaOnlyMobileCard
                key={row.key}
                user={giteaUser}
                processing={giteaProcessingUsername === giteaUser.username}
                onChangePassword={onChangeGiteaPassword}
              />
            );
          }
          if (!usuario) return null;

          const userDocencias = docencias[usuario.id] || [];
          const assignedIds = new Set(
            userDocencias.map(item => item.materiaId)
          );
          const availableMaterias = materias.filter(
            item => !assignedIds.has(item.id)
          );
          const isCurrentUser = usuario.email === currentEmail;

          return (
            <article
              key={row.key}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="break-words font-black text-slate-950 dark:text-white">
                    {usuario.nombre} {usuario.apellido}
                  </h3>
                  <p className="break-all text-sm text-slate-500 dark:text-slate-300">
                    {usuario.email}
                  </p>
                  <p className="mt-1 break-all text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Git: {giteaUser?.username || usuario.githubUser || '-'}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                    Último acceso: {formatLastAccess(usuario.ultimoAccesoAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <StatusBadge usuario={usuario} />
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {roleLabels[usuario.rol]}
                  </span>
                </div>
              </div>

              {!usuario.activo && usuario.suspensionMotivo && (
                <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                  {usuario.suspensionMotivo}
                </p>
              )}

              <div className="grid gap-4">
                <label className="grid gap-1">
                  <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    Rol
                  </span>
                  <select
                    value={usuario.rol}
                    disabled={processingId === usuario.id}
                    onChange={event =>
                      onRoleChange(
                        usuario,
                        event.target.value as Usuario['rol']
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  >
                    {Object.entries(roleLabels).map(([rol, label]) => (
                      <option key={rol} value={rol}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    Alumno en
                  </p>
                  <StudentEnrollments
                    enrollments={usuario.materiasAlumno || []}
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    Docente en
                  </p>
                  <TeacherAssignments
                    usuario={usuario}
                    userDocencias={userDocencias}
                    processingId={processingId}
                    onRemoveTeacher={onRemoveTeacher}
                  />
                  <TeacherAssignControl
                    usuario={usuario}
                    availableMaterias={availableMaterias}
                    selectedMateria={selectedMateria}
                    setSelectedMateria={setSelectedMateria}
                    processingId={processingId}
                    onAssignTeacher={onAssignTeacher}
                  />
                </div>

                <div>
                  {giteaUser && (
                    <Button
                      variant="outline"
                      fullWidth
                      className="mb-2"
                      onClick={() => onChangeGiteaPassword(giteaUser)}
                      disabled={giteaProcessingUsername === giteaUser.username}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Cambiar contraseña de Gitea
                    </Button>
                  )}
                  {usuario.activo ? (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => onSuspend(usuario)}
                      disabled={processingId === usuario.id || isCurrentUser}
                      title={
                        isCurrentUser
                          ? 'No puedes suspender tu propio usuario'
                          : undefined
                      }
                    >
                      <UserRoundX className="mr-2 h-4 w-4" />
                      Suspender
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      onClick={() => onReactivate(usuario)}
                      disabled={processingId === usuario.id}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Reactivar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    fullWidth
                    className="mt-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10"
                    onClick={() => onDelete(usuario)}
                    disabled={processingId === usuario.id || isCurrentUser}
                    title={
                      isCurrentUser
                        ? 'No puedes eliminar tu propio usuario'
                        : 'Eliminar de la plataforma y Gitea'
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar plataforma y Gitea
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1080px] table-fixed divide-y divide-slate-200 text-sm dark:divide-white/10">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="w-[22%] px-4 py-3">Usuario</th>
              <th className="w-[14%] px-4 py-3">Cuenta</th>
              <th className="w-[14%] px-4 py-3">Alumno en</th>
              <th className="w-[24%] px-4 py-3">Docente en</th>
              <th className="w-[12%] px-4 py-3">Gitea y actividad</th>
              <th className="w-[14%] px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {rows.map(row => {
              const usuario = row.platformUser;
              const giteaUser = row.giteaUser;

              if (!usuario && giteaUser) {
                return (
                  <GiteaOnlyDesktopRow
                    key={row.key}
                    user={giteaUser}
                    processing={giteaProcessingUsername === giteaUser.username}
                    onChangePassword={onChangeGiteaPassword}
                  />
                );
              }
              if (!usuario) return null;

              const userDocencias = docencias[usuario.id] || [];
              const assignedIds = new Set(
                userDocencias.map(item => item.materiaId)
              );
              const availableMaterias = materias.filter(
                item => !assignedIds.has(item.id)
              );
              const isCurrentUser = usuario.email === currentEmail;

              return (
                <tr key={row.key} className="align-top">
                  <td className="px-4 py-3">
                    <div className="break-words font-semibold text-slate-950 dark:text-white">
                      {usuario.nombre} {usuario.apellido}
                    </div>
                    <div className="break-all text-slate-500">
                      {usuario.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="grid gap-2">
                      <select
                        value={usuario.rol}
                        disabled={processingId === usuario.id}
                        onChange={event =>
                          onRoleChange(
                            usuario,
                            event.target.value as Usuario['rol']
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                      >
                        {Object.entries(roleLabels).map(([rol, label]) => (
                          <option key={rol} value={rol}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <div>
                        <StatusBadge usuario={usuario} />
                      </div>
                      {!usuario.activo && usuario.suspensionMotivo && (
                        <div className="break-words text-xs text-slate-500">
                          {usuario.suspensionMotivo}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StudentEnrollments
                      enrollments={usuario.materiasAlumno || []}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <TeacherAssignments
                      usuario={usuario}
                      userDocencias={userDocencias}
                      processingId={processingId}
                      onRemoveTeacher={onRemoveTeacher}
                    />
                    <TeacherAssignControl
                      usuario={usuario}
                      availableMaterias={availableMaterias}
                      selectedMateria={selectedMateria}
                      setSelectedMateria={setSelectedMateria}
                      processingId={processingId}
                      onAssignTeacher={onAssignTeacher}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <span className="block max-w-full break-words">
                      {giteaUser?.username || usuario.githubUser || '-'}
                    </span>
                    {giteaUser ? (
                      <GiteaAccountBadge user={giteaUser} />
                    ) : usuario.githubUser ? (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                        {giteaAvailable
                          ? 'No encontrada en Gitea'
                          : 'Sin verificar en Gitea'}
                      </span>
                    ) : null}
                    <span className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Último acceso
                    </span>
                    <span className="block text-xs">
                      {formatLastAccess(usuario.ultimoAccesoAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 justify-end gap-2">
                      {giteaUser && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3"
                          onClick={() => onChangeGiteaPassword(giteaUser)}
                          disabled={
                            giteaProcessingUsername === giteaUser.username
                          }
                          title="Cambiar contraseña de Gitea"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      )}
                      {usuario.activo ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3"
                          onClick={() => onSuspend(usuario)}
                          disabled={
                            processingId === usuario.id || isCurrentUser
                          }
                          title={
                            isCurrentUser
                              ? 'No puedes suspender tu propio usuario'
                              : 'Suspender usuario'
                          }
                        >
                          <UserRoundX className="h-4 w-4" />
                          <span className="sr-only">Suspender</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="px-3"
                          onClick={() => onReactivate(usuario)}
                          disabled={processingId === usuario.id}
                          title="Reactivar"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="sr-only">Reactivar</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 px-3 text-red-700 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10"
                        onClick={() => onDelete(usuario)}
                        disabled={processingId === usuario.id || isCurrentUser}
                        title={
                          isCurrentUser
                            ? 'No puedes eliminar tu propio usuario'
                            : 'Eliminar de la plataforma y Gitea'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GiteaOnlyMobileCard({
  user,
  processing,
  onChangePassword,
}: {
  user: GiteaAdminUser;
  processing: boolean;
  onChangePassword: (user: GiteaAdminUser) => void;
}) {
  return (
    <article className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-300/20 dark:bg-amber-950/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-black text-slate-950 dark:text-white">
            {user.fullName || user.username}
          </h3>
          <p className="break-all text-sm text-slate-500 dark:text-slate-300">
            {user.email || 'Sin email visible'}
          </p>
          <p className="mt-1 break-all text-xs font-semibold text-slate-500 dark:text-slate-400">
            Git: {user.username}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            Sin vincular
          </span>
          <GiteaAccountBadge user={user} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Esta cuenta existe en Gitea pero todavía no tiene un usuario asociado en
        el campus.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          fullWidth
          onClick={() => onChangePassword(user)}
          disabled={processing}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          Cambiar contraseña
        </Button>
        {user.htmlUrl && (
          <a
            href={user.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
          >
            Abrir en Gitea <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}

function GiteaOnlyDesktopRow({
  user,
  processing,
  onChangePassword,
}: {
  user: GiteaAdminUser;
  processing: boolean;
  onChangePassword: (user: GiteaAdminUser) => void;
}) {
  return (
    <tr className="bg-amber-50/40 align-top dark:bg-amber-950/10">
      <td className="px-4 py-3">
        <div className="break-words font-semibold text-slate-950 dark:text-white">
          {user.fullName || user.username}
        </div>
        <div className="break-all text-slate-500">
          {user.email || 'Sin email visible'}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="grid justify-items-start gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            Sin vincular
          </span>
          <GiteaAccountBadge user={user} />
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">Sin materias</td>
      <td className="px-4 py-3 text-xs text-slate-500">Sin docencias</td>
      <td className="px-4 py-3">
        <span className="break-all font-semibold text-slate-700 dark:text-slate-200">
          {user.username}
        </span>
        <span className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Último acceso
        </span>
        <span className="block text-xs text-slate-600 dark:text-slate-300">
          {formatLastAccess(user.lastLoginAt)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangePassword(user)}
            disabled={processing}
            title="Cambiar contraseña de Gitea"
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          {user.htmlUrl && (
            <a
              href={user.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="app-icon-button h-9 w-9"
              title="Abrir cuenta en Gitea"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

function formatLastAccess(value?: string | null) {
  if (!value) return 'Nunca';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin datos';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function StudentEnrollments({ enrollments }: { enrollments: AlumnoMateria[] }) {
  if (enrollments.length === 0) {
    return <span className="text-xs text-slate-500">Sin materias</span>;
  }

  const statusStyles: Record<AlumnoMateria['estado'], string> = {
    aprobado:
      'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800',
    pendiente:
      'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800',
    rechazado:
      'bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {enrollments.map(enrollment => {
        const materiaName =
          enrollment.materia?.nombre || `Materia ${enrollment.materiaId}`;
        const comisionName = enrollment.comision?.nombre;

        return (
          <span
            key={enrollment.id}
            className={`inline-flex max-w-full flex-col rounded-lg px-2 py-1 text-xs ring-1 ${statusStyles[enrollment.estado]}`}
            title={`${materiaName} · ${enrollment.estado}${comisionName ? ` · ${comisionName}` : ''}`}
          >
            <span className="max-w-full truncate font-bold">{materiaName}</span>
            <span className="text-[10px] font-semibold capitalize opacity-80">
              {enrollment.estado}
              {comisionName ? ` · ${comisionName}` : ''}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function TeacherAssignments({
  usuario,
  userDocencias,
  processingId,
  onRemoveTeacher,
}: {
  usuario: Usuario;
  userDocencias: ProfesorMateria[];
  processingId: number | null;
  onRemoveTeacher: (usuario: Usuario, docencia: ProfesorMateria) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {userDocencias.length === 0 && (
        <span className="text-xs text-slate-500">Sin materias asignadas</span>
      )}
      {userDocencias.map(docencia => (
        <span
          key={docencia.id}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
        >
          <span className="min-w-0 truncate">
            {docencia.materia?.nombre || `Materia ${docencia.materiaId}`}
          </span>
          <button
            type="button"
            onClick={() => onRemoveTeacher(usuario, docencia)}
            disabled={processingId === usuario.id}
            className="shrink-0 rounded-full p-0.5 text-cyan-700 hover:bg-cyan-100 dark:text-cyan-200 dark:hover:bg-cyan-900"
            title="Quitar docencia"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

function TeacherAssignControl({
  usuario,
  availableMaterias,
  selectedMateria,
  setSelectedMateria,
  processingId,
  onAssignTeacher,
}: {
  usuario: Usuario;
  availableMaterias: MateriaResumen[];
  selectedMateria: Record<number, string>;
  setSelectedMateria: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  processingId: number | null;
  onAssignTeacher: (usuario: Usuario) => void;
}) {
  return (
    <div className="mt-3 flex gap-2">
      <select
        value={selectedMateria[usuario.id] || ''}
        onChange={event =>
          setSelectedMateria(prev => ({
            ...prev,
            [usuario.id]: event.target.value,
          }))
        }
        className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white"
      >
        <option value="">Agregar materia docente</option>
        {availableMaterias.map(materia => (
          <option key={materia.id} value={materia.id}>
            {materia.nombre}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onAssignTeacher(usuario)}
        disabled={processingId === usuario.id}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-300/30 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
        title="Asignar docencia"
      >
        <UserPlus className="h-4 w-4" />
      </button>
    </div>
  );
}

function AuditList({ auditLogs }: { auditLogs: AdminAuditLog[] }) {
  if (auditLogs.length === 0) {
    return (
      <div className="app-empty-state">
        No hay eventos administrativos registrados.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {auditLogs.map(log => (
        <div key={log.id} className="app-surface-interactive p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <p className="font-semibold text-slate-950 dark:text-white">
                  {actionLabels[log.action] || log.title}
                </p>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {log.detail}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Actor: {log.actorEmail || log.actor?.email || '-'} · Usuario:{' '}
                {log.targetEmail || log.targetUser?.email || '-'}
              </p>
            </div>
            <time className="text-xs text-slate-500">
              {new Date(log.createdAt).toLocaleString('es-AR')}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}

function TechnicalStatus({
  estado,
  maintenance,
  setMaintenance,
  onRefresh,
  refreshAudit,
}: {
  estado: AdminEstadoTecnico | null;
  maintenance: MaintenanceStatus | null;
  setMaintenance: React.Dispatch<
    React.SetStateAction<MaintenanceStatus | null>
  >;
  onRefresh: () => void;
  refreshAudit: () => Promise<void>;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<MaintenanceStatus>(
    maintenance || {
      enabled: false,
      title: 'Campus en mantenimiento',
      message:
        'Estamos realizando tareas de mantenimiento. El acceso se restablecera cuando finalicen los trabajos.',
      estimatedUntil: null,
      scheduledAt: null,
    }
  );

  useEffect(() => {
    if (maintenance) setDraft(maintenance);
  }, [maintenance]);

  if (!estado) return null;

  const handleSaveMaintenance = async (enabled: boolean) => {
    setSaving(true);
    try {
      const updated = await usuarioService.actualizarMaintenanceStatus({
        ...draft,
        enabled,
      });
      setMaintenance(updated);
      setDraft(updated);
      await refreshAudit();
      toast.success(
        enabled
          ? 'Modo mantenimiento activado'
          : 'Modo mantenimiento desactivado'
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'No se pudo actualizar mantenimiento'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <StatusPanel
        title="API"
        icon={<HeartPulse className="h-5 w-5" />}
        status={estado.status}
        rows={[
          ['Version', estado.version],
          ['Actualizado', new Date(estado.timestamp).toLocaleString('es-AR')],
        ]}
      />
      <StatusPanel
        title="Base de datos"
        icon={<Database className="h-5 w-5" />}
        status={estado.database.ok ? 'ok' : 'degraded'}
        rows={[
          ['Tipo', estado.database.type],
          [
            'Latencia',
            estado.database.latencyMs === null
              ? '-'
              : `${estado.database.latencyMs} ms`,
          ],
        ]}
      />
      <StatusPanel
        title="Integraciones"
        icon={<Shield className="h-5 w-5" />}
        status={
          estado.gitea.configured && estado.auth.secretConfigured
            ? 'ok'
            : 'degraded'
        }
        rows={[
          ['Gitea', estado.gitea.configured ? 'Configurado' : 'Pendiente'],
          [
            'Auth secret',
            estado.auth.secretConfigured ? 'Configurado' : 'Pendiente',
          ],
          [
            'Admins env',
            estado.auth.adminEmailsConfigured ? 'Configurado' : 'Pendiente',
          ],
        ]}
      />
      <div className="app-surface p-4 lg:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-950 dark:text-white">
            Datos monitoreados
          </h3>
          <Button variant="outline" onClick={onRefresh}>
            Actualizar
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniStat label="Materias" value={estado.data.materias} />
          <MiniStat
            label="Auditoria global"
            value={estado.data.auditoriaGlobal}
          />
          <MiniStat
            label="Logs de materias"
            value={estado.data.auditoriaMaterias}
          />
        </div>
      </div>
      <div className="app-surface p-4 lg:col-span-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="font-semibold text-slate-950 dark:text-white">
              Modo mantenimiento
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cuando esta activo, alumnos y docentes solo ven el aviso. Los
              administradores conservan acceso para operar el campus.
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              draft.enabled
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}
          >
            {draft.enabled ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Titulo
            </span>
            <input
              value={draft.title}
              onChange={event =>
                setDraft(prev => ({ ...prev, title: event.target.value }))
              }
              className="app-form-control text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Fin estimado
            </span>
            <input
              type="datetime-local"
              value={
                draft.estimatedUntil
                  ? new Date(draft.estimatedUntil).toISOString().slice(0, 16)
                  : ''
              }
              onChange={event =>
                setDraft(prev => ({
                  ...prev,
                  estimatedUntil: event.target.value || null,
                }))
              }
              className="app-form-control text-sm"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Mensaje para usuarios
            </span>
            <textarea
              value={draft.message}
              onChange={event =>
                setDraft(prev => ({ ...prev, message: event.target.value }))
              }
              rows={3}
              className="app-form-control text-sm"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => handleSaveMaintenance(true)}
            disabled={saving || draft.enabled}
          >
            Activar mantenimiento
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSaveMaintenance(false)}
            disabled={saving || !draft.enabled}
          >
            Desactivar
          </Button>
        </div>
      </div>
    </section>
  );
}

function StatusPanel({
  title,
  icon,
  status,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  status: 'ok' | 'degraded';
  rows: Array<[string, string]>;
}) {
  return (
    <article className="app-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
          {icon}
          {title}
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            status === 'ok'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          {status === 'ok' ? 'OK' : 'Revisar'}
        </span>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-800 dark:text-slate-200">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-100 p-3 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-[-1px] flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
          : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusBadge({ usuario }: { usuario: Usuario }) {
  if (usuario.activo) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        Activo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
      Suspendido
    </span>
  );
}
