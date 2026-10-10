import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Loader2, MessageSquare } from 'lucide-react';
import {
  actividadService,
  HistorialAlumno,
} from '../../../../../../services/actividad.service';

const HistorialAlumnoPage: React.FC = () => {
  const { id, alumnoId } = useParams<{ id: string; alumnoId: string }>();
  const [searchParams] = useSearchParams();
  const materiaId = Number(id);
  const parsedAlumnoId = Number(alumnoId);
  const cursadaId = searchParams.get('cursadaId')
    ? Number(searchParams.get('cursadaId'))
    : undefined;

  const [historial, setHistorial] = useState<HistorialAlumno | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistorial = async () => {
      try {
        setLoading(true);
        setError(null);
        setHistorial(
          await actividadService.obtenerHistorialAlumno(
            materiaId,
            parsedAlumnoId,
            cursadaId
          )
        );
      } catch (err) {
        console.error('Error cargando historial:', err);
        setError('No se pudo cargar el historial del alumno');
      } finally {
        setLoading(false);
      }
    };

    if (materiaId && parsedAlumnoId) loadHistorial();
  }, [materiaId, parsedAlumnoId, cursadaId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando historial...
      </div>
    );
  }

  const alumno = historial?.alumno;
  const entregadas =
    historial?.actividades.filter(item => item.entrega !== null).length || 0;
  const total = historial?.actividades.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to={`/materia/${materiaId}/planilla-seguimiento${cursadaId ? `?cursadaId=${cursadaId}` : ''}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            aria-label="Volver a planilla"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black sm:text-2xl">
              Historial del alumno
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {alumno
                ? `${alumno.apellido}, ${alumno.nombre}`
                : 'Sin datos disponibles'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
            {error}
          </div>
        )}

        {historial && alumno && (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Comision
                </p>
                <p className="mt-2 text-2xl font-black">
                  {alumno.comision.nombre}
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Usuario Gitea
                </p>
                <p className="mt-2 break-words text-2xl font-black">
                  {alumno.githubUser || 'Sin usuario'}
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Entregas registradas
                </p>
                <p className="mt-2 text-2xl font-black">
                  {entregadas}/{total}
                </p>
              </article>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                <h2 className="text-lg font-black">Actividades</h2>
              </div>

              <div className="space-y-3">
                {historial.actividades.map(({ actividad, entrega }) => (
                  <article
                    key={actividad.id}
                    className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-black">{actividad.nombre}</h3>
                        {actividad.descripcion && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {actividad.descripcion}
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          entrega
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-300/15 dark:text-emerald-100'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                        }`}
                      >
                        {entrega ? 'Registrada' : 'Sin registro'}
                      </span>
                    </div>

                    {entrega && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                          <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                            Nota
                          </p>
                          <p className="mt-1 font-black">
                            {actividad.tipoCalificacion === 'numerico'
                              ? (entrega.notaNumerica ?? 'Sin nota')
                              : entrega.notaConceptual || 'Sin nota'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                          <p className="flex items-center gap-1 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                            <MessageSquare className="h-3 w-3" />
                            Comentario
                          </p>
                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                            {entrega.comentario || 'Sin comentario'}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default HistorialAlumnoPage;
