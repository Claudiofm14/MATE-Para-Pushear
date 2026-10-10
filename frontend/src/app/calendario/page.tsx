import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, Loader2 } from 'lucide-react';
import {
  CalendarEvent,
  dashboardService,
} from '../../services/dashboard.service';
import { useAuth } from '../auth/contexts/AuthContext';
import { ThemeToggle } from '../../shared/components/ThemeToggle';

export const CalendarioPage: React.FC = () => {
  const { authenticated, isInitialized, login } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    if (!authenticated) {
      setLoading(false);
      return;
    }

    const loadCalendar = async () => {
      try {
        setLoading(true);
        setError(null);
        setEvents(await dashboardService.getCalendar());
      } catch (err) {
        console.error('Error cargando calendario:', err);
        setError('No se pudo cargar el calendario');
      } finally {
        setLoading(false);
      }
    };

    loadCalendar();
  }, [authenticated, isInitialized]);

  const groupedEvents = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] || []), event];
      return acc;
    }, {});
  }, [events]);

  if (!isInitialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando calendario...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900">
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">
            Calendario
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Inicia sesion para ver clases y entregas.
          </p>
          <button
            onClick={() => login('/calendario')}
            className="mt-5 w-full rounded-2xl bg-emerald-400 px-4 py-3 font-black text-slate-950 shadow-lg shadow-emerald-950/15 hover:bg-emerald-300"
          >
            Iniciar sesion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-screen-2xl items-start justify-between gap-3 px-4 py-4 sm:items-center sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-black sm:text-2xl">Calendario</h1>
              <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                Clases y entregas visibles para tu rol.
              </p>
            </div>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-white/15 dark:bg-slate-900 dark:text-slate-400">
            No hay clases ni entregas cargadas.
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <section
                key={date}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900"
              >
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  <h2 className="text-lg font-black">
                    {new Date(`${date}T00:00:00`).toLocaleDateString()}
                  </h2>
                </div>

                <div className="space-y-3">
                  {dateEvents.map(event => {
                    const content = (
                      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 transition-all hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                        <div
                          className={`mt-0.5 rounded-xl p-2 ${
                            event.type === 'entrega'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-100'
                              : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-300/15 dark:text-cyan-100'
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black">{event.title}</p>
                          <p className="mt-1 text-sm capitalize text-slate-600 dark:text-slate-300">
                            {event.type}
                          </p>
                        </div>
                      </div>
                    );

                    return event.href ? (
                      <Link key={event.id} to={event.href}>
                        {content}
                      </Link>
                    ) : (
                      <div key={event.id}>{content}</div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CalendarioPage;
