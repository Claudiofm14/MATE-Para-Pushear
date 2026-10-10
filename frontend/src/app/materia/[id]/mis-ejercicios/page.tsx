import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  GitBranch,
  GitCommit,
} from 'lucide-react';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { ErrorComponent } from '../../../../components/ErrorComponent';
import {
  ejercicioService,
  MyExerciseRepository,
} from '../../../../services/ejercicio.service';
import { useToast } from '../../../../hooks';

const statusLabel: Record<MyExerciseRepository['status'], string> = {
  pending: 'Pendiente',
  creating: 'Creando',
  created: 'Creado',
  failed: 'Con error',
};

const statusClass: Record<MyExerciseRepository['status'], string> = {
  pending:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100',
  creating:
    'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-100',
  created:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-100',
  failed:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-100',
};

const formatDate = (value?: string) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return null;
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MisEjerciciosPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const materiaId = Number(id);
  const toast = useToast();
  const [repos, setRepos] = useState<MyExerciseRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRepos = async () => {
      if (!materiaId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await ejercicioService.getMyReposByMateria(materiaId);
        setRepos(data);
      } catch (err: any) {
        console.error('Error cargando mis ejercicios:', err);
        setError(
          err.response?.data?.message ||
            'No se pudieron cargar tus ejercicios de Gitea'
        );
      } finally {
        setLoading(false);
      }
    };

    loadRepos();
  }, [materiaId]);

  const copy = async (value?: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success('Copiado');
  };

  if (loading) {
    return (
      <LoadingSpinner fullScreen size="lg" label="Cargando ejercicios..." />
    );
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  const cursada = repos[0]?.cursada;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 text-slate-950 dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              to={`/materia/${materiaId}/semanas`}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Mis ejercicios
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Repositorios generados en la cursada actual
                {cursada?.giteaOrgName ? ` (${cursada.giteaOrgName})` : ''}.
              </p>
            </div>
          </div>

          {cursada?.giteaOrgUrl && (
            <a
              href={cursada.giteaOrgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-100 dark:hover:bg-blue-900/45"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir organizacion
            </a>
          )}
        </div>

        {repos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/85 p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <GitBranch className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-xl font-black">
              Todavia no tenes repositorios generados
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-600 dark:text-slate-300">
              Cuando abras un ejercicio de programacion con plantilla Gitea, se
              va a crear tu repositorio privado y va a aparecer aca.
            </p>
            <Link
              to={`/materia/${materiaId}/semanas`}
              className="mt-5 inline-flex rounded-xl bg-emerald-400 px-4 py-2 font-black text-slate-950 transition hover:bg-emerald-300 dark:text-white"
            >
              Ver semanas
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {repos.map(repo => (
              <article
                key={repo.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${statusClass[repo.status]}`}
                      >
                        {repo.status === 'created' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : repo.status === 'failed' ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {statusLabel[repo.status]}
                      </span>
                      {repo.exercise?.dueDate && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(repo.exercise.dueDate)}
                        </span>
                      )}
                    </div>
                    <h2 className="truncate text-lg font-black">
                      {repo.exercise?.title || repo.repoName}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Semana {repo.week?.number || '-'} ·{' '}
                      {repo.week?.title || 'Sin titulo'}
                    </p>
                  </div>
                  <GitBranch className="h-6 w-6 shrink-0 text-blue-500" />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                  <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    Repositorio
                  </div>
                  <div className="mt-1 truncate font-mono text-sm font-bold">
                    {repo.repoFullName || repo.repoName}
                  </div>
                  {repo.errorMessage && (
                    <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-300">
                      {repo.errorMessage}
                    </p>
                  )}
                </div>

                {repo.lastCommitMessage && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                      <GitCommit className="h-4 w-4" />
                      Ultimo commit
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold">
                      {repo.lastCommitMessage}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {repo.lastCommitAuthor || 'Sin autor'} ·{' '}
                      {formatDateTime(repo.lastCommitAt) || 'sin fecha'}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {repo.repoUrl && (
                    <a
                      href={repo.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300 dark:text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir repo
                    </a>
                  )}
                  {repo.cloneUrlHttp && (
                    <button
                      type="button"
                      onClick={() => copy(`git clone ${repo.cloneUrlHttp}`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar clone
                    </button>
                  )}
                  {repo.cloneUrlSsh && (
                    <button
                      type="button"
                      onClick={() => copy(`git clone ${repo.cloneUrlSsh}`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <Copy className="h-4 w-4" />
                      SSH
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MisEjerciciosPage;
