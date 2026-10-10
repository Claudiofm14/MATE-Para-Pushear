import React from 'react';

/**
 * Estado vacio de una seccion de la semana. Mantiene la altura y el ritmo
 * visual de las tarjetas para que la pagina no colapse cuando una seccion
 * todavia no tiene contenido cargado.
 */
export const SectionEmpty: React.FC<{
  icon: React.ReactNode;
  title: string;
  hint?: string;
}> = ({ icon, title, hint }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-500/[0.03] px-6 py-10 text-center dark:border-white/10 dark:bg-white/[0.02]">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400 dark:bg-white/5 dark:text-slate-500">
      {icon}
    </span>
    <div>
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
        {title}
      </p>
      {hint && (
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  </div>
);

export default SectionEmpty;
