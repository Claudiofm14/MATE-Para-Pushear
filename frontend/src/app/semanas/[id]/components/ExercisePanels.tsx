import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  GitFork,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useToast } from '../../../../hooks';
import {
  ejercicioService,
  Ejercicio,
  StudentExerciseRepository,
  TeacherExerciseRepository,
} from '../../../../services';
import type { ExerciseGroup } from '../../../../services/ejercicio.service';
import {
  ActionButton,
  ActionLink,
  ActionSkeleton,
  CloneCommand,
  FOCUS_RING,
  StatusLine,
} from './cardKit';

/* -------------------------------------------------------------------------
 * Copia docente del ejercicio
 * ---------------------------------------------------------------------- */

export const TeacherRepoPanel: React.FC<{ ejercicio: Ejercicio }> = ({
  ejercicio,
}) => {
  const [repo, setRepo] = useState<TeacherExerciseRepository | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ejercicioService
      .getTeacherRepo(ejercicio.id)
      .then(data => {
        if (!cancelled) setRepo(data);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              'No se pudo consultar tu repositorio docente'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ejercicio.id]);

  const createRepo = async () => {
    setCreating(true);
    setError(null);
    try {
      setRepo(await ejercicioService.ensureTeacherRepo(ejercicio.id));
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'No se pudo preparar tu repositorio docente'
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <ActionSkeleton label="Consultando tu copia docente" />;

  if (repo?.status === 'created') {
    return (
      <div className="space-y-1.5">
        <ActionLink
          href={repo.giteaRepoUrl}
          variant="soft"
          accent="blue"
          icon={<GitFork className="h-4 w-4" />}
          label="Mi resolucion docente"
        />
        {repo.giteaCloneUrlHttp && (
          <CloneCommand url={repo.giteaCloneUrlHttp} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {error && (
        <StatusLine tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
          {error}
        </StatusLine>
      )}
      <ActionButton
        variant="soft"
        accent="blue"
        icon={
          repo?.status === 'failed' ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <GitFork className="h-4 w-4" />
          )
        }
        label={
          creating
            ? 'Preparando copia docente...'
            : repo?.status === 'failed'
              ? 'Reintentar copia docente'
              : 'Crear mi copia para resolver'
        }
        loading={creating}
        onClick={createRepo}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------
 * Repositorio individual del alumno
 * ---------------------------------------------------------------------- */

export const StudentRepoPanel: React.FC<{ ejercicio: Ejercicio }> = ({
  ejercicio,
}) => {
  const [repo, setRepo] = useState<StudentExerciseRepository | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al abrir la semana solo se CONSULTA el repositorio (lectura a la base).
  // Antes se llamaba a ensureStudentRepo() en cada montaje, que ademas de
  // escribir en la base hace 2 llamadas a la API de Gitea por ejercicio:
  // una semana con varios ejercicios disparaba decenas de llamadas
  // externas por alumno, cada vez que alguien entraba a la pantalla.
  useEffect(() => {
    let cancelled = false;
    ejercicioService
      .getStudentRepo(ejercicio.id)
      .then(data => {
        if (!cancelled) setRepo(data);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message || 'No se pudo consultar tu repositorio'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ejercicio.id]);

  const crearRepo = async () => {
    setCreating(true);
    setError(null);
    try {
      setRepo(await ejercicioService.ensureStudentRepo(ejercicio.id));
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'No se pudo preparar el repositorio'
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <ActionSkeleton label="Consultando tu repositorio" />;

  if (error) {
    return (
      <StatusLine tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
        {error}
      </StatusLine>
    );
  }

  if (!repo || repo.status !== 'created') {
    return (
      <ActionButton
        variant="solid"
        accent="emerald"
        icon={<GitFork className="h-4 w-4" />}
        label={creating ? 'Creando tu repositorio...' : 'Crear mi repositorio'}
        loading={creating}
        onClick={crearRepo}
      />
    );
  }

  return (
    <div className="space-y-1.5">
      <ActionLink
        href={repo.giteaRepoUrl}
        variant="solid"
        accent="emerald"
        icon={<GitFork className="h-4 w-4" />}
        label="Abrir mi repositorio"
      />
      {repo.giteaCloneUrlHttp && <CloneCommand url={repo.giteaCloneUrlHttp} />}
    </div>
  );
};

/* -------------------------------------------------------------------------
 * Ejercicios grupales
 * ---------------------------------------------------------------------- */

const repoStatusMeta = (status?: string) => {
  switch (status) {
    case 'ready':
      return {
        tone: 'success' as const,
        icon: <CheckCircle2 className="h-4 w-4" />,
        text: 'Repositorio listo y compartido',
      };
    case 'creating':
      return {
        tone: 'pending' as const,
        icon: <Clock className="h-4 w-4 animate-pulse" />,
        text: 'Repositorio creandose',
      };
    case 'error':
      return {
        tone: 'danger' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        text: 'Error de sincronizacion',
      };
    default:
      return {
        tone: 'neutral' as const,
        icon: <Clock className="h-4 w-4" />,
        text: 'Repositorio todavia no generado',
      };
  }
};

export const GroupExercisePanel: React.FC<{
  ejercicio: Ejercicio;
  canEdit: boolean;
}> = ({ ejercicio, canEdit }) => {
  const toast = useToast();
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [mine, setMine] = useState<ExerciseGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [groupName, setGroupName] = useState('');

  const load = React.useCallback(async () => {
    try {
      const [all, myGroup] = await Promise.all([
        ejercicioService.listGroups(ejercicio.id),
        canEdit
          ? Promise.resolve(null)
          : ejercicioService.myGroup(ejercicio.id),
      ]);
      setGroups(all);
      if (!canEdit) setMine(myGroup);
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || 'No se pudieron cargar los grupos'
      );
    }
  }, [canEdit, ejercicio.id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<any>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || 'No se pudo completar la operación'
      );
    } finally {
      setBusy(false);
    }
  };

  const createGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) return toast.error('Ingresa un nombre para el grupo');
    setBusy(true);
    try {
      await ejercicioService.createGroup(ejercicio.id, name);
      await load();
      setCreateOpen(false);
      setGroupName('');
      toast.success('Grupo creado');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo crear el grupo');
    } finally {
      setBusy(false);
    }
  };

  /* ----------------------------- Vista docente ---------------------------- */

  if (canEdit) {
    return (
      <div className="overflow-hidden rounded-xl ring-1 ring-violet-500/20 dark:ring-violet-400/20">
        <button
          type="button"
          onClick={() => setGroupsOpen(open => !open)}
          aria-expanded={groupsOpen}
          className={`flex w-full items-center justify-between gap-2 bg-violet-500/[0.07] px-3.5 py-2.5 text-left text-sm font-bold text-violet-700 transition-colors hover:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-400/15 ${FOCUS_RING} focus-visible:ring-violet-500/60`}
        >
          <span className="inline-flex items-center gap-2.5">
            <Users className="h-4 w-4 shrink-0" />
            Grupos de estudiantes
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-black text-violet-700 dark:bg-violet-400/15 dark:text-violet-200">
              {groups.length}
            </span>
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-200 ${groupsOpen ? 'rotate-90' : ''}`}
            />
          </span>
        </button>

        {groupsOpen && (
          <div className="max-h-[26rem] space-y-2 overflow-y-auto border-t border-violet-500/15 bg-white p-2 dark:bg-slate-900/60">
            {groups.length === 0 && (
              <p className="px-2 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                Todavía no hay grupos creados.
              </p>
            )}

            {groups.map(group => {
              const status = repoStatusMeta(group.repository?.syncStatus);
              return (
                <div
                  key={group.id}
                  className="overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-white/10"
                >
                  <div className="flex items-start justify-between gap-3 bg-slate-500/[0.05] px-3 py-2.5 dark:bg-white/[0.03]">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {group.name}
                      </h4>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {group.memberCount} de {group.maxGroupSize} integrantes
                        · mínimo {group.minGroupSize}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                        group.incomplete
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {group.incomplete ? 'Incompleto' : 'Grupo listo'}
                    </span>
                  </div>

                  <div className="space-y-1.5 p-2.5">
                    {group.members.length === 0 ? (
                      <p className="px-1 py-1 text-xs text-slate-500 dark:text-slate-400">
                        Sin integrantes
                      </p>
                    ) : (
                      group.members.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-slate-500/[0.05] px-2.5 py-1.5 dark:bg-white/[0.03]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                              {member.student.nombre} {member.student.apellido}
                            </p>
                            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {member.student.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={busy}
                            title={`Quitar a ${member.student.nombre} del grupo y revocar su acceso al repositorio`}
                            onClick={() =>
                              run(() =>
                                ejercicioService.adminRemoveMember(
                                  ejercicio.id,
                                  group.id,
                                  member.studentId
                                )
                              )
                            }
                            className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-black text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-300 ${FOCUS_RING} focus-visible:ring-red-500/60`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Quitar
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 border-t border-slate-200 p-2.5 dark:border-white/10">
                    <StatusLine tone={status.tone} icon={status.icon}>
                      {status.text}
                    </StatusLine>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(() =>
                            ejercicioService.lockGroup(
                              ejercicio.id,
                              group.id,
                              !group.modificationsLocked
                            )
                          )
                        }
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-500/10 disabled:opacity-50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10 ${FOCUS_RING}`}
                      >
                        {group.modificationsLocked ? 'Desbloquear' : 'Bloquear'}
                      </button>

                      {group.repository?.syncStatus !== 'ready' && (
                        <button
                          type="button"
                          disabled={
                            busy || group.repository?.syncStatus === 'creating'
                          }
                          onClick={() =>
                            run(() =>
                              ejercicioService.adminGroupRepo(
                                ejercicio.id,
                                group.id
                              )
                            )
                          }
                          className={`rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-black text-white transition-colors hover:bg-blue-500 disabled:opacity-50 ${FOCUS_RING} focus-visible:ring-blue-500/60`}
                        >
                          {group.repository?.syncStatus === 'error'
                            ? 'Reintentar'
                            : group.repository?.syncStatus === 'creating'
                              ? 'Creando…'
                              : 'Generar repositorio'}
                        </button>
                      )}

                      {group.repository?.repositoryUrl && (
                        <a
                          href={group.repository.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-black text-white transition-colors hover:bg-emerald-500 ${FOCUS_RING} focus-visible:ring-emerald-500/60`}
                        >
                          <GitFork className="h-3.5 w-3.5" />
                          Abrir repositorio
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ------------------------ Alumno todavía sin grupo ---------------------- */

  if (!mine) {
    const joinable = groups.filter(
      group =>
        !group.modificationsLocked &&
        (group.memberCount || 0) < (group.maxGroupSize || 0)
    );

    return (
      <>
        <div className="space-y-2 rounded-xl bg-violet-500/[0.06] p-2.5 ring-1 ring-violet-500/20 dark:ring-violet-400/20">
          <div className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">
            <Users className="h-3.5 w-3.5" />
            Asignación grupal
          </div>

          {ejercicio.allowStudentGroupCreation && (
            <ActionButton
              variant="solid"
              accent="violet"
              icon={<Plus className="h-4 w-4" />}
              label="Crear grupo"
              disabled={busy}
              onClick={() => setCreateOpen(true)}
            />
          )}

          {joinable.length === 0 ? (
            <p className="px-1 pb-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {groups.length === 0
                ? 'Todavía no hay grupos disponibles.'
                : 'Todos los grupos están completos o bloqueados.'}
            </p>
          ) : (
            joinable.map(group => (
              <button
                key={group.id}
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => ejercicioService.joinGroup(ejercicio.id, group.id))
                }
                className={`flex w-full items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left text-sm font-bold text-slate-800 ring-1 ring-slate-200 transition-colors hover:bg-violet-500/10 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10 ${FOCUS_RING} focus-visible:ring-violet-500/60`}
              >
                <span className="truncate">{group.name}</span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-black text-violet-600 dark:text-violet-300">
                  <UserPlus className="h-3.5 w-3.5" />
                  Unirse · {group.memberCount}/{group.maxGroupSize}
                </span>
              </button>
            ))
          )}
        </div>

        {createOpen &&
          createPortal(
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Cerrar"
                className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
                onClick={() => !busy && setCreateOpen(false)}
              />
              <form
                onSubmit={createGroup}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/40 dark:border-white/10 dark:bg-slate-900"
              >
                <div className="border-b border-slate-200 bg-gradient-to-br from-violet-50 to-white px-6 py-5 dark:border-white/10 dark:from-violet-950/50 dark:to-slate-900">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    Crear un nuevo grupo
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Serás el primer integrante. Tus compañeros podrán
                    encontrarlo y sumarse mientras tenga cupo.
                  </p>
                </div>
                <div className="px-6 py-5">
                  <label
                    htmlFor={`group-name-${ejercicio.id}`}
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Nombre del grupo
                  </label>
                  <input
                    id={`group-name-${ejercicio.id}`}
                    autoFocus
                    maxLength={100}
                    value={groupName}
                    onChange={event => setGroupName(event.target.value)}
                    placeholder="Ej: Equipo Lambda"
                    disabled={busy}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  <div className="mt-2 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>Debe ser único en este ejercicio</span>
                    <span>{groupName.length}/100</span>
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-white/10 dark:bg-slate-950/60 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setCreateOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !groupName.trim()}
                    className="rounded-xl bg-violet-600 px-5 py-2.5 font-black text-white shadow-lg shadow-violet-950/20 hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? 'Creando…' : 'Crear grupo'}
                  </button>
                </div>
              </form>
            </div>,
            document.body
          )}
      </>
    );
  }

  /* -------------------------- Alumno con grupo --------------------------- */

  const count = mine.members.length;
  const missing = Math.max(0, (ejercicio.minGroupSize || 1) - count);
  const ready = mine.repository?.syncStatus === 'ready';

  return (
    <div className="space-y-2 rounded-xl bg-violet-500/[0.06] p-2.5 ring-1 ring-violet-500/20 dark:ring-violet-400/20">
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">
            {mine.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {mine.members
              .map(
                member => `${member.student.nombre} ${member.student.apellido}`
              )
              .join(', ')}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-1 text-[11px] font-black text-violet-700 dark:text-violet-300">
          {count}/{ejercicio.maxGroupSize}
        </span>
      </div>

      {missing > 0 && (
        <StatusLine tone="pending" icon={<AlertTriangle className="h-4 w-4" />}>
          Faltan {missing} integrante(s) para comenzar.
        </StatusLine>
      )}

      {ready ? (
        <ActionLink
          href={mine.repository?.repositoryUrl}
          variant="solid"
          accent="emerald"
          icon={<GitFork className="h-4 w-4" />}
          label="Abrir repositorio compartido"
        />
      ) : (
        <ActionButton
          variant="solid"
          accent="violet"
          icon={
            mine.repository?.syncStatus === 'error' ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <GitFork className="h-4 w-4" />
            )
          }
          label={
            mine.repository?.syncStatus === 'creating'
              ? 'Creando…'
              : mine.repository?.syncStatus === 'error'
                ? 'Reintentar'
                : 'Generar repositorio'
          }
          loading={busy && mine.repository?.syncStatus === 'creating'}
          disabled={busy || missing > 0}
          title={
            missing > 0
              ? 'El grupo necesita más integrantes antes de generar el repositorio'
              : undefined
          }
          onClick={() =>
            run(() => ejercicioService.ensureGroupRepo(ejercicio.id, mine.id))
          }
        />
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => ejercicioService.leaveGroup(ejercicio.id))}
        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:text-slate-400 dark:hover:text-red-300 ${FOCUS_RING} focus-visible:ring-red-500/60`}
      >
        <LogOut className="h-3.5 w-3.5" />
        Abandonar grupo
      </button>
    </div>
  );
};
