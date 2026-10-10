import { ReactNode } from 'react';
/**
 * GradientCard
 *
 * Tarjeta visual con fondo de gradiente, ideal para destacar información importante.
 * Permite personalizar colores, ícono, título, descripción y contenido adicional.
 *
 * Props principales:
 * - gradientFrom/gradientTo: Clases tailwind para el gradiente.
 * - icon: Ícono opcional.
 * - title: Título de la tarjeta.
 * - description: Descripción opcional.
 * - children: Contenido adicional.
 * - className: Clases CSS adicionales.
 *
 * Uso:
 * <GradientCard gradientFrom="from-blue-500" gradientTo="to-indigo-500" title="Título" />
 */

interface GradientCardProps {
  gradientFrom: string;
  gradientTo: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function GradientCard({
  gradientFrom,
  gradientTo,
  icon,
  title,
  description,
  children,
  className = '',
}: GradientCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} p-6`}>
        <div className="flex items-center gap-4">
          {icon && (
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              {icon}
            </div>
          )}
          <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>
        </div>
      </div>
      <div className="p-6">
        {description && (
          <p className="mb-4 text-gray-700 dark:text-gray-300">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
