/**
 * Design Tokens - Sistema de diseño unificado
 * Basado en el diseño de referencia del campus virtual UNAHUR
 */

export const colors = {
  // Colores primarios
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // Azul principal
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a', // Azul oscuro
  },

  // Colores secundarios
  purple: {
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
  },

  // Colores de estado
  success: {
    500: '#10b981',
    600: '#059669',
  },
  warning: {
    500: '#f59e0b',
    600: '#d97706',
  },
  danger: {
    500: '#ef4444',
    600: '#dc2626',
  },

  // Grises
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const gradients = {
  primary: 'from-blue-600 to-purple-600',
  primaryHover: 'from-blue-700 to-purple-700',
  background: 'from-blue-50 via-white to-purple-50',
  backgroundDark: 'from-gray-900 via-gray-800 to-gray-900',
  warning: 'from-amber-400 to-orange-500',
  card: 'from-blue-600 to-purple-600',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};

export const spacing = {
  xs: '0.5rem', // 8px
  sm: '1rem', // 16px
  md: '1.5rem', // 24px
  lg: '2rem', // 32px
  xl: '3rem', // 48px
  '2xl': '4rem', // 64px
};

export const borderRadius = {
  sm: '0.25rem', // 4px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Utilidades para clases de Tailwind
export const tw = {
  // Gradientes comunes
  gradientPrimary: `bg-gradient-to-r ${gradients.primary}`,
  gradientPrimaryHover: `hover:bg-gradient-to-r hover:${gradients.primaryHover}`,
  gradientBackground: `bg-gradient-to-br ${gradients.background} dark:${gradients.backgroundDark}`,

  // Sombras
  shadowCard: 'shadow-md hover:shadow-xl transition-shadow duration-300',

  // Transiciones
  transition: 'transition-all duration-300',
  transitionFast: 'transition-all duration-200',

  // Bordes redondeados
  roundedCard: 'rounded-xl',
  roundedButton: 'rounded-full',
};
