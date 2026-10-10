import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'dark' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  id?: string;
}

/**
 * Componente Card del Design System
 * Tarjeta reutilizable con múltiples variantes
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick,
  id,
}) => {
  const baseClasses = 'overflow-hidden rounded-2xl';

  const variantClasses = {
    default:
      'border border-slate-200 bg-white shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20',
    dark: 'border border-slate-700 bg-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-900',
    gradient:
      'border border-blue-500/30 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-950/20',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-5 sm:p-8',
  };

  const hoverClass = hover
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-slate-950/10 dark:hover:border-emerald-800 dark:hover:shadow-black/30'
    : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      id={id}
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
