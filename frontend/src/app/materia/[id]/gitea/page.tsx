import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  GitBranch,
  RefreshCw,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import {
  GiteaRepoStatus,
  giteaStatusService,
} from '../../../../services/gitea-status.service';
import { useToast } from '../../../../hooks';
import { getApiErrorMessage } from '../../../../utils/api-error';

const statusLabel: Record<GiteaRepoStatus['status'], string> = {
  pending: 'Pendiente',
  creating: 'Creando',
  created: 'Creado',
  failed: 'Error',
};

const statusClass: Record<GiteaRepoStatus['status'], string> = {
  pending: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
  creating: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-300/15 dark:text-cyan-100',
  created:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-300/15 dark:text-emerald-100',
  failed: 'bg-red-100 text-red-800 dark:bg-red-300/15 dark:text-red-100',
};

const GiteaStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const materiaId = Number(id);
  const studentId = searchParams.get('studentId')
    ? Number(searchParams.get('studentId'))
    : null;
  const toast = useToast();
  const [items, setItems] = useState<GiteaRepoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setItems(await giteaStatusService.list(materiaId));
      } catch (error) {
        console.error('Error cargando estado Gitea:', error);
        toast.error('No se pudo cargar el estado de Gitea');
      } finally {
        setLoading(false);
      }
    };

    if (materiaId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId]);

  const visibleItems = useMemo(
    () =>
      studentId ? items.filter(item => item.student.id === studentId) : items,
    [items, studentId]
  );

  const selectedStudent = visibleItems[0]?.student;

  const counts = useMemo(() => {
    return visibleItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }, [visibleItems]);

  const alerts = useMemo(
    () => visibleItems.filter(item => item.alertLevel !== 'none'),
    [visibleItems]
  );

  const handleSync = async () => {
    try {
      setSyncing(true);
      setItems(await giteaStatusService.sync(materiaId));
      toast.success('Estado Gitea sincronizado');
    } catch (error) {
      console.error('Error sincronizando Gitea:', error);
      toast.error(
        getApiErrorMessage(error, 'No se pudo sincronizar con Gitea')
      );
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" label="Cargando Gitea..." />;
  }

  return (
    <div className="app-page">
      <div className="app-page-container max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-100">
              <GitBranch className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white">
              Estado Gitea
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {selectedStudent
                ? `Repositorios de ${selectedStudent.name || selectedStudent.giteaUser || selectedStudent.email}, separados por ejercicio.`
                : 'Repositorios de ejercicios generados para alumnos.'}
            </p>
            {studentId && (
              <Link
                to={`/materia/${materiaId}/gitea`}
                className="mt-3 inline-flex text-sm font-bold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
              >
                Ver todos los alumnos
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || items.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/15 transition-all hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Gitea'}
          </button>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-4">
          {(['created', 'failed', 'creating', 'pending'] as const).map(
            status => (
              <article key={status} className="app-surface p-4">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {statusLabel[status]}
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                  {counts[status] || 0}
                </p>
              </article>
            )
          )}
        </section>

        {alerts.length > 0 && (
          <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-300/20 dark:bg-amber-300/10">
            <div className="mb-3 flex items-center gap-2 font-black text-amber-900 dark:text-amber-100">
              <AlertTriangle className="h-5 w-5" />
              Alertas Gitea
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {alerts.slice(0, 6).map(item => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-amber-200 bg-white/80 p-3 text-sm dark:border-amber-300/20 dark:bg-slate-950/40"
                >
                  <p className="font-bold text-slate-900 dark:text-white">
                    {item.student.name ||
                      item.student.giteaUser ||
                      item.student.email}{' '}
                    - {item.exercise.title || `#${item.exercise.id}`}
                  </p>
                  <p className="mt-1 text-amber-800 dark:text-amber-100">
                    {item.alertMessage}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {visibleItems.length === 0 ? (
          <div className="app-empty-state">
            {studentId
              ? 'No hay repositorios generados para este alumno.'
              : 'Todavia no hay repositorios generados para esta materia.'}
          </div>
        ) : (
          <div className="app-table-shell">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                      Alumno
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                      Ejercicio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                      Repo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                      Ultimo commit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                      Sincronizado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {visibleItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.student.name ||
                          item.student.giteaUser ||
                          item.student.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        {item.exercise.title || `#${item.exercise.id}`}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.repoUrl ? (
                          <a
                            href={item.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 font-bold text-emerald-700 hover:underline dark:text-emerald-300"
                          >
                            {item.repoName}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-500">Sin URL</span>
                        )}
                        {item.errorMessage && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                            {item.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${statusClass[item.status]}`}
                        >
                          {statusLabel[item.status]}
                        </span>
                        {item.alertMessage && (
                          <p
                            className={`mt-1 text-xs font-bold ${
                              item.alertLevel === 'error'
                                ? 'text-red-600 dark:text-red-300'
                                : 'text-amber-700 dark:text-amber-200'
                            }`}
                          >
                            {item.alertMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {item.lastCommitAt ? (
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">
                              {new Date(item.lastCommitAt).toLocaleString()}
                            </p>
                            {item.lastCommitMessage && (
                              <p className="mt-1 max-w-[260px] truncate text-xs">
                                {item.lastCommitMessage}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin commits</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {item.lastSyncedAt
                          ? new Date(item.lastSyncedAt).toLocaleString()
                          : 'Nunca'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiteaStatusPage;
