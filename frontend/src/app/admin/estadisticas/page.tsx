import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Clock3,
  Eye,
  RefreshCw,
  Users,
  Wifi,
} from 'lucide-react';
import { PageTransition } from '../../../components/PageTransition';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorComponent } from '../../../components/ErrorComponent';
import {
  AdminActivityStatistics,
  usuarioService,
} from '../../../services/usuario.service';

const roleLabels: Record<string, string> = {
  admin: 'Administradores',
  docente: 'Docentes',
  alumno: 'Alumnos',
};

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  hour: '2-digit',
  minute: '2-digit',
});

export default function AdminEstadisticasPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminActivityStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setData(await usuarioService.obtenerEstadisticasActividad());
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          'No se pudieron cargar las estadísticas.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(true), 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const maxTrend = useMemo(
    () => Math.max(1, ...(data?.trend.map(day => day.users) || [])),
    [data]
  );
  const maxHourly = useMemo(
    () => Math.max(1, ...(data?.hourly.map(hour => hour.users) || [])),
    [data]
  );
  const maxSection = Math.max(
    1,
    ...(data?.sections.map(item => item.views) || [])
  );

  if (loading) {
    return <LoadingSpinner fullScreen label="Preparando estadísticas..." />;
  }

  if (error && !data) {
    return (
      <div className="app-page">
        <ErrorComponent error={error} onRetry={() => load()} />
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      label: 'Activos ahora',
      value: data.summary.activeNow,
      detail: `Actividad en los últimos ${data.activeWindowMinutes} min`,
      icon: Wifi,
      iconClass:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
    },
    {
      label: 'Usuarios hoy',
      value: data.summary.usersToday,
      detail: 'Personas únicas conectadas',
      icon: Users,
      iconClass:
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300',
    },
    {
      label: 'Movimientos hoy',
      value: data.summary.eventsToday,
      detail: 'Presencia y cambios de sección',
      icon: Activity,
      iconClass:
        'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
    },
    {
      label: 'Usuarios registrados',
      value: data.summary.totalUsers,
      detail: 'Total histórico de cuentas',
      icon: BarChart3,
      iconClass:
        'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
    },
  ];

  return (
    <PageTransition className="app-page">
      <div className="app-page-container max-w-7xl">
        <div className="app-page-header mb-7 items-start">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate('/materias')}
              className="app-icon-button mt-1"
              aria-label="Volver a materias"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Monitoreo en vivo
              </div>
              <h1 className="app-page-title">Estadísticas de usuarios</h1>
              <p className="app-page-description">
                Conexiones, navegación y uso general del campus.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Actualizar
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
            {error} Se muestran los últimos datos disponibles.
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(card => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {card.label}
                    </p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                      {card.value.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <span className={`rounded-xl p-2.5 ${card.iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {card.detail}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
          <Panel
            title="Usuarios por día"
            subtitle="Personas únicas · últimos 14 días"
          >
            <div className="mt-6 flex h-52 items-end gap-2 sm:gap-3">
              {data.trend.map(day => (
                <div
                  key={day.date}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {day.users || ''}
                  </span>
                  <div className="flex h-36 w-full items-end rounded-lg bg-slate-100 p-1 dark:bg-white/5">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-cyan-500 to-emerald-400 transition-all"
                      style={{
                        height: `${Math.max(day.users ? 8 : 0, (day.users / maxTrend) * 100)}%`,
                      }}
                      title={`${day.users} usuarios · ${day.views} vistas`}
                    />
                  </div>
                  <span className="truncate text-[10px] font-semibold text-slate-500 sm:text-xs">
                    {dateFormatter.format(
                      new Date(`${day.date}T12:00:00-03:00`)
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Usuarios por rol"
            subtitle="Cuentas activas de la plataforma"
          >
            <div className="mt-5 space-y-5">
              {data.roles.map((item, index) => {
                const total = Math.max(
                  1,
                  data.roles.reduce((sum, role) => sum + role.count, 0)
                );
                const colors = [
                  'bg-cyan-500',
                  'bg-violet-500',
                  'bg-emerald-500',
                ];
                return (
                  <div key={item.role}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {roleLabels[item.role] || item.role}
                      </span>
                      <span className="font-black text-slate-950 dark:text-white">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div
                        className={`h-full rounded-full ${colors[index % colors.length]}`}
                        style={{ width: `${(item.count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <Panel
            title="Horas de mayor actividad"
            subtitle="Usuarios únicos conectados hoy"
          >
            <div className="mt-6 flex h-40 items-end gap-1">
              {data.hourly.map(item => (
                <div
                  key={item.hour}
                  className="flex h-full min-w-0 flex-1 items-end"
                >
                  <div
                    className="w-full rounded-t bg-violet-400/80 hover:bg-violet-500"
                    style={{
                      height: `${Math.max(item.users ? 5 : 1, (item.users / maxHourly) * 100)}%`,
                    }}
                    title={`${item.hour}:00 · ${item.users} usuarios · ${item.events} movimientos`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
              <span>00 h</span>
              <span>06 h</span>
              <span>12 h</span>
              <span>18 h</span>
              <span>23 h</span>
            </div>
          </Panel>

          <Panel
            title="Secciones más visitadas"
            subtitle="Vistas acumuladas en los últimos 30 días"
          >
            <div className="mt-5 space-y-3">
              {data.sections.length ? (
                data.sections.slice(0, 7).map(item => (
                  <div key={item.path}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-bold text-slate-700 dark:text-slate-200">
                        {item.label}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-slate-500">
                        {item.views} vistas · {item.users} usuarios
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-500"
                        style={{ width: `${(item.views / maxSection) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="Todavía no hay navegación registrada." />
              )}
            </div>
          </Panel>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
          <Panel
            title={`Conectados ahora (${data.usersOnline.length})`}
            subtitle={`Actividad dentro de los últimos ${data.activeWindowMinutes} minutos`}
          >
            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
              {data.usersOnline.length ? (
                data.usersOnline.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/5"
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white dark:bg-emerald-400 dark:text-slate-950">
                      {user.nombre?.[0]}
                      {user.apellido?.[0]}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {user.nombre} {user.apellido}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-extrabold uppercase text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {user.rol}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState text="No hay usuarios activos en este momento." />
              )}
            </div>
          </Panel>

          <Panel
            title="Movimientos recientes"
            subtitle="Cambios de sección más recientes"
          >
            <div className="mt-4 max-h-96 divide-y divide-slate-100 overflow-y-auto pr-1 dark:divide-white/10">
              {data.recent.length ? (
                data.recent.map(item => (
                  <div key={item.id} className="flex gap-3 py-3 first:pt-0">
                    <span className="mt-0.5 rounded-lg bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                      <Eye className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>
                          {item.user?.name || 'Usuario eliminado'}
                        </strong>{' '}
                        {item.kind === 'action' ? (
                          <>
                            <strong>{item.label}</strong>
                          </>
                        ) : (
                          <>
                            visitó <strong>{item.label}</strong>
                          </>
                        )}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {item.user?.email}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {timeFormatter.format(new Date(item.createdAt))}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState text="Todavía no hay movimientos registrados." />
              )}
            </div>
          </Panel>
        </section>

        <p className="mt-5 text-right text-xs text-slate-500">
          Última actualización:{' '}
          {timeFormatter.format(new Date(data.generatedAt))}. Los datos
          históricos se recopilan desde la instalación de esta funcionalidad.
        </p>
      </div>
    </PageTransition>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:p-6">
      <h2 className="text-lg font-black text-slate-950 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
      {children}
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-white/5">
      {text}
    </p>
  );
}
