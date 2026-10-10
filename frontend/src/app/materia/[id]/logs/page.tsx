import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  Calendar,
  ClipboardList,
  Filter,
  Settings,
  User,
} from 'lucide-react';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { usePermissions, useToast } from '../../../../hooks';
import {
  MateriaLog,
  materiaConfigService,
} from '../../../../services/materia-config.service';
import { formatDate } from '../../../../shared/utils/dateUtils';

const actionLabels: Record<string, string> = {
  created: 'Creación',
  updated: 'Actualización',
  deleted: 'Eliminación',
  restored: 'Restauración',
  archived: 'Archivado',
  unarchived: 'Desarchivado',
  finalized: 'Finalización',
  config_updated: 'Configuración',
};

const resourceLabels: Record<string, string> = {
  cursada: 'Cursada',
  semana: 'Semana',
  material: 'Material',
  video: 'Video',
  materia_configuracion: 'Configuración',
  materia: 'Materia',
};

const resourceIcons: Record<string, React.ElementType> = {
  cursada: Calendar,
  semana: ClipboardList,
  material: BookOpen,
  video: Activity,
  materia_configuracion: Settings,
};

const MateriaLogsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const materiaId = Number(id);
  const { canManageCurrentMateria } = usePermissions();
  const toast = useToast();

  const [logs, setLogs] = useState<MateriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState('todos');
  const [actionFilter, setActionFilter] = useState('todos');

  const loadLogs = useCallback(async () => {
    if (!materiaId || !canManageCurrentMateria) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await materiaConfigService.getLogs(materiaId);
      setLogs(data);
    } catch (error) {
      console.error('Error al cargar logs:', error);
      toast.error('Error al cargar los logs de la materia');
    } finally {
      setLoading(false);
    }
    // useToast devuelve un objeto nuevo por render; no debe disparar recargas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId, canManageCurrentMateria]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(
    () =>
      logs.filter(log => {
        const matchesResource =
          resourceFilter === 'todos' || log.resourceType === resourceFilter;
        const matchesAction =
          actionFilter === 'todos' || log.action === actionFilter;
        return matchesResource && matchesAction;
      }),
    [logs, resourceFilter, actionFilter]
  );

  const resourceOptions = Array.from(
    new Set(logs.map(log => log.resourceType))
  );
  const actionOptions = Array.from(new Set(logs.map(log => log.action)));

  if (!canManageCurrentMateria) {
    return (
      <div className="materia-page-shell flex items-center justify-center p-6">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        <div className="relative z-10 max-w-xl rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900/90">
          <BookOpen className="mx-auto mb-4 h-14 w-14 text-slate-400" />
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">
            No tenés acceso a esta sección
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            Los logs solo son visibles para profesores de la materia y
            administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="materia-page-shell">
      <div className="materia-page-gradient" />
      <div className="materia-page-grid" />
      <section className="materia-hero">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <Activity className="w-6 h-6" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Auditoría
              </span>
            </div>
            <h1 className="materia-hero-title text-3xl font-black tracking-tight">
              Logs de la materia
            </h1>
            <p className="materia-hero-description max-w-3xl text-sm font-medium leading-6 sm:text-base">
              Registro cronológico de cambios relevantes realizados dentro de la
              materia, con usuario, acción, recurso afectado y detalle.
            </p>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="app-toolbar mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,220px)_minmax(0,220px)] sm:items-center">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <select
            value={resourceFilter}
            onChange={e => setResourceFilter(e.target.value)}
            className="app-form-control"
          >
            <option value="todos">Todos los recursos</option>
            {resourceOptions.map(resource => (
              <option key={resource} value={resource}>
                {resourceLabels[resource] || resource}
              </option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="app-form-control"
          >
            <option value="todos">Todas las acciones</option>
            {actionOptions.map(action => (
              <option key={action} value={action}>
                {actionLabels[action] || action}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="app-empty-state p-10">
            <Activity className="mx-auto mb-3 h-12 w-12 text-slate-400" />
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              No hay movimientos para mostrar
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Cuando se modifiquen cursadas, semanas o configuración, aparecerán
              en este registro.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => {
              const Icon = resourceIcons[log.resourceType] || Activity;
              return (
                <article
                  key={log.id}
                  className="app-surface-interactive p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="min-w-0 break-words font-semibold text-gray-900 dark:text-white">
                          {log.title}
                        </h2>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                          {resourceLabels[log.resourceType] || log.resourceType}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          {actionLabels[log.action] || log.action}
                        </span>
                      </div>
                      {log.detail && (
                        <p className="mt-1 break-words text-sm text-gray-600 dark:text-gray-300">
                          {log.detail}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(log.createdAt)}</span>
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {log.actorNombre || log.actorEmail || 'Sistema'}
                        </span>
                        {log.resourceId && <span>ID: {log.resourceId}</span>}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MateriaLogsPage;
