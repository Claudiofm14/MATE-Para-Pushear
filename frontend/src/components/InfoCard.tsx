/**
 * InfoCard
 *
 * Tarjeta informativa con ícono, título y descripción, con variantes de color.
 * Útil para mostrar información resumida o destacada.
 *
 * Props principales:
 * - icon: Ícono opcional.
 * - title: Título.
 * - description: Descripción.
 * - variant: Color de la tarjeta ('blue', 'green', 'yellow', 'purple', 'red', 'orange', 'gray').
 * - className: Clases CSS adicionales.
 *
 * Uso:
 * <InfoCard icon={<Icon />} title="Info" description="Detalle" variant="yellow" />
 */
import { ReactNode } from 'react';

interface InfoCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  variant?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'orange' | 'gray';
  className?: string;
}

const variantStyles = {
  blue: 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20',
  green:
    'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
  yellow:
    'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 dark:border-yellow-800 dark:from-yellow-900/20 dark:to-amber-900/20',
  purple:
    'border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 dark:border-purple-800 dark:from-purple-900/20 dark:to-violet-900/20',
  red: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
  orange:
    'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
  gray: 'border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 dark:border-gray-700 dark:from-gray-900/50 dark:to-slate-900/50',
};

const iconStyles = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-500',
};

const titleStyles = {
  blue: 'text-blue-800 dark:text-blue-300',
  green: 'text-green-700 dark:text-green-300',
  yellow: 'text-yellow-800 dark:text-yellow-300',
  purple: 'text-purple-800 dark:text-purple-300',
  red: 'text-red-800 dark:text-red-300',
  orange: 'text-orange-800 dark:text-orange-300',
  gray: 'text-gray-800 dark:text-gray-200',
};

export function InfoCard({
  icon,
  title,
  description,
  variant = 'blue',
  className = '',
}: InfoCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className={`mt-1 rounded-lg p-2 ${iconStyles[variant]}`}>
            <div className="h-5 w-5 text-white">{icon}</div>
          </div>
        )}
        <div className="flex-1">
          <h3 className={`mb-3 text-xl font-bold ${titleStyles[variant]}`}>
            {title}
          </h3>
          <p className="leading-relaxed text-gray-700 dark:text-gray-300">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
