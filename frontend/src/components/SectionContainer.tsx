import { ReactNode } from 'react';

/**
 * SectionContainer
 *
 * Componente contenedor de secciones, útil para agrupar contenido bajo un título y/o subtítulo opcional.
 * Permite personalizar el encabezado con gradiente, ícono y bordes.
 *
 * Props principales:
 * - title: Título de la sección.
 * - subtitle: Subtítulo opcional.
 * - children: Contenido de la sección.
 * - headerGradientFrom/headerGradientTo: Gradiente opcional para el encabezado.
 * - headerIcon: Ícono opcional en el encabezado.
 * - className: Clases CSS adicionales.
 * - withBorder: Mostrar borde exterior.
 *
 * Uso:
 * <SectionContainer title="Mi sección" subtitle="Subtítulo">Contenido aquí</SectionContainer>
 */

interface SectionContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  headerGradientFrom?: string;
  headerGradientTo?: string;
  headerIcon?: ReactNode;
  className?: string;
  withBorder?: boolean;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  subtitle,
  children,
  headerGradientFrom,
  headerGradientTo,
  headerIcon,
  className = '',
  withBorder = true,
}) => {
  const hasHeader = title || headerGradientFrom;

  return (
    <div
      className={`overflow-hidden rounded-2xl ${withBorder ? 'border border-gray-200 dark:border-gray-700' : ''} bg-white shadow-xl dark:bg-gray-800 ${className}`}
    >
      {hasHeader && (
        <div
          className={`p-6 ${headerGradientFrom && headerGradientTo ? `bg-gradient-to-r ${headerGradientFrom} ${headerGradientTo}` : 'border-b border-gray-200 dark:border-gray-700'}`}
        >
          {headerGradientFrom ? (
            <div className="flex items-center gap-4">
              {headerIcon && (
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                  {headerIcon}
                </div>
              )}
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                {title}
              </h2>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              {subtitle && (
                <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
              )}
            </div>
          )}
        </div>
      )}
      <div className="p-8">{children}</div>
    </div>
  );
};
