import React from 'react';
import {
  Video,
  BookOpen,
  Calendar,
  ChevronRight,
  AlertCircle,
  Copy,
} from 'lucide-react';

export interface WeekCardProps {
  weekNumber: number;
  title: string;
  description: string;
  startDate: string;
  classDate?: string;
  hasImportantNotice: boolean;
  hasVideos: boolean;
  hasExercises: boolean;
  tags: string[];
  comisiones?: string[];
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onDuplicate?: (e: React.MouseEvent) => void;
}

export const WeekCard: React.FC<WeekCardProps> = ({
  weekNumber,
  title,
  description,
  startDate,
  classDate,
  hasImportantNotice,
  hasVideos,
  hasExercises,
  comisiones,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    // Parsear fecha sin conversión de zona horaria
    // Si viene "2025-11-24T00:00:00.000Z", extraemos solo la parte de la fecha
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    // Crear fecha en zona horaria local sin conversión UTC
    const date = new Date(year, month - 1, day);

    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Truncar descripción a un máximo de caracteres
  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Determinar si la semana es "nueva" (menos de 7 días desde la fecha de inicio)
  const isNew = () => {
    const weekDate = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - weekDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  return (
    <div
      className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.96] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900/90"
      onClick={onClick}
    >
      {/* Color Accent */}
      <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-black tracking-wider text-emerald-700 uppercase mb-1 block">
              Semana {weekNumber}
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                {formatDate(classDate || startDate)}
              </span>
              {isNew() && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                  NUEVO
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          {(onEdit || onDelete || onDuplicate) && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              {onDuplicate && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDuplicate(e);
                  }}
                  className="p-2 rounded-xl border border-slate-200 bg-white/90 text-cyan-700 shadow-sm backdrop-blur-sm hover:scale-105 transition-all"
                  title="Duplicar"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(e);
                  }}
                  className="p-2 rounded-xl border border-slate-200 bg-white/90 text-emerald-700 shadow-sm backdrop-blur-sm hover:scale-105 transition-all"
                  title="Editar"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(e);
                  }}
                  className="p-2 rounded-xl border border-slate-200 bg-white/90 text-red-600 shadow-sm backdrop-blur-sm hover:scale-105 transition-all"
                  title="Eliminar"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="mb-3">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {truncateDescription(description)}
          </p>
        </div>

        {/* Comisiones / tags */}
        {comisiones && comisiones.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {comisiones.map((c, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 dark:bg-gray-800 dark:text-gray-200"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {hasImportantNotice && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Hay avisos importantes para esta semana
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-4">
            {hasVideos && (
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Video className="w-4 h-4" />
                </div>
                <span>Videos</span>
              </div>
            )}
            {hasExercises && (
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Ejercicios</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/90 text-slate-400 shadow-sm">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
