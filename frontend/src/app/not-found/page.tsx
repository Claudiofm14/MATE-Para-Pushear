import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, SearchX } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="materia-page-shell flex items-center justify-center p-4">
      <div className="materia-page-gradient" />
      <div className="materia-page-grid" />
      <div className="relative z-10 mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white/90 px-6 py-10 text-center shadow-2xl shadow-slate-950/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 sm:px-10">
        <h1 className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-7xl font-black tracking-tighter text-transparent sm:text-8xl">
          404
        </h1>

        <div className="mx-auto mb-5 mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
          <SearchX className="h-7 w-7" />
        </div>

        <h2 className="mb-3 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
          Página no encontrada
        </h2>
        <p className="mx-auto mb-7 max-w-md text-sm font-medium leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
          La página que estás buscando no existe, fue movida o ya no está
          disponible.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/materias"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
          >
            <Home className="h-4 w-4" />
            Ir a Materias
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
};
