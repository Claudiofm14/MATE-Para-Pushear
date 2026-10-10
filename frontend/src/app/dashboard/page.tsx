import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Gauge,
  Loader2,
  TriangleAlert,
} from 'lucide-react';
import {
  dashboardService,
  DashboardData,
  DashboardNotification,
} from '../../services/dashboard.service';
import { useAuth } from '../auth/contexts/AuthContext';
import { ThemeToggle } from '../../shared/components/ThemeToggle';

const notificationStyles: Record<DashboardNotification['type'], string> = {
  info: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100',
};

const priorityStyles: Record<string, string> = {
  high: 'bg-emerald-400 text-slate-950 shadow-emerald-950/15 hover:bg-emerald-300',
  medium:
    'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
  low: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/10',
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { authenticated, isInitialized, login, userInfo } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    if (!authenticated) {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        setDashboard(await dashboardService.getDashboard());
      } catch (err) {
        console.error('Error cargando dashboard:', err);
        setError('No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [authenticated, isInitialized]);

  if (!isInitialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando dashboard...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900">
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Inicia sesion para ver tus pendientes, notificaciones y accesos
            rapidos.
          </p>
          <button
            onClick={() => login('/dashboard')}
            className="mt-5 w-full rounded-2xl bg-emerald-400 px-4 py-3 font-black text-slate-950 shadow-lg shadow-emerald-950/15 hover:bg-emerald-300"
          >
            Iniciar sesion
          </button>
        </div>
      </div>
    );
  }

  const displayName =
    dashboard?.usuario.nombre ||
    userInfo?.name ||
    userInfo?.username ||
    'Usuario';
  const actions = dashboard?.actions || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-screen-2xl items-start justify-between gap-3 px-4 py-4 sm:items-center sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/materias"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label="Volver a materias"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-black sm:text-2xl">Dashboard</h1>
              <p className="truncate text-sm text-slate-600 dark:text-slate-300">
                {displayName} · {dashboard?.usuario.rol || userInfo?.roles[0]}
              </p>
            </div>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
            {error}
          </div>
        )}

        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-lg font-black">Resumen</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboard?.cards.map(card => (
              <article
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900"
              >
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="mt-3 text-4xl font-black">{card.value}</p>
                {card.detail && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {card.detail}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        <div
          className={
            actions.length > 0
              ? 'grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]'
              : 'grid gap-6'
          }
        >
          {actions.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900">
              <h2 className="text-lg font-black">Acciones recomendadas</h2>
              <div className="mt-4 space-y-3">
                {actions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.href)}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black shadow-sm transition-all hover:-translate-y-0.5 ${priorityStyles[action.priority]}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-lg font-black">Notificaciones</h2>
            </div>

            {dashboard?.notifications.length ? (
              <div className="space-y-3">
                {dashboard.notifications.map(notification => {
                  const Icon =
                    notification.type === 'warning'
                      ? TriangleAlert
                      : notification.type === 'success'
                        ? CheckCircle2
                        : Bell;

                  const content = (
                    <div
                      className={`flex gap-3 rounded-2xl border p-4 transition-all ${notificationStyles[notification.type]}`}
                    >
                      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-black">{notification.title}</p>
                        <p className="mt-1 text-sm opacity-90">
                          {notification.detail}
                        </p>
                        <p className="mt-2 text-xs font-semibold opacity-70">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );

                  return notification.href ? (
                    <Link key={notification.id} to={notification.href}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">
                No hay notificaciones pendientes.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
