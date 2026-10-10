import React from 'react';
import { MaterialAcademico } from '../services';
import { BlockRenderer } from './BlockRenderer';
import { MaterialContent } from '../types/content-blocks';

interface MaterialRendererProps {
  material: MaterialAcademico;
}

export const MaterialRenderer: React.FC<MaterialRendererProps> = ({
  material,
}) => {
  const getColorClasses = (color?: string) => {
    const colorMap: Record<
      string,
      { gradient: string; bg: string; text: string; border: string }
    > = {
      blue: {
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
      },
      purple: {
        gradient: 'from-purple-500 to-pink-500',
        bg: 'bg-purple-50 dark:bg-purple-900/10',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
      },
      green: {
        gradient: 'from-green-500 to-emerald-500',
        bg: 'bg-green-50 dark:bg-green-900/10',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
      },
      orange: {
        gradient: 'from-orange-500 to-amber-500',
        bg: 'bg-orange-50 dark:bg-orange-900/10',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
      },
      red: {
        gradient: 'from-red-500 to-rose-500',
        bg: 'bg-red-50 dark:bg-red-900/10',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
      },
      pink: {
        gradient: 'from-pink-500 to-rose-500',
        bg: 'bg-pink-50 dark:bg-pink-900/10',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-200 dark:border-pink-800',
      },
      gray: {
        gradient: 'from-gray-500 to-slate-500',
        bg: 'bg-gray-50 dark:bg-gray-900/10',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800',
      },
    };
    return colorMap[color || 'blue'] || colorMap.blue;
  };

  const colors = getColorClasses(material.color);
  const hasContent =
    material.contenido &&
    (material.contenido as MaterialContent).blocks &&
    (material.contenido as MaterialContent).blocks.length > 0;

  return (
    <div className="min-w-0 space-y-4">
      {/* Header - Siempre visible */}
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colors.gradient} text-2xl shadow-lg`}
        >
          {material.icono || '📚'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="mb-1 break-words text-lg font-bold text-gray-900 dark:text-white">
            {material.titulo}
          </h3>
          {material.descripcion && (
            <p className="break-words text-sm text-gray-600 dark:text-gray-400">
              {material.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* Contenido - Siempre visible */}
      {hasContent && (
        <div
          className={`min-w-0 overflow-hidden rounded-xl border p-4 sm:p-6 ${colors.bg} ${colors.border}`}
        >
          <BlockRenderer
            content={material.contenido as MaterialContent}
            color={material.color}
            collapseMarkdown
          />
        </div>
      )}
    </div>
  );
};

export default MaterialRenderer;
