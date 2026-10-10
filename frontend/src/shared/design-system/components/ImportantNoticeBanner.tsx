import React from 'react';
import { AlertCircle } from 'lucide-react';
import { sanitizeRichHtml } from '../../utils/htmlSanitizer';

export interface ImportantNoticeBannerProps {
  title?: string;
  content: string;
  variant?: 'warning' | 'danger' | 'info';
  className?: string;
}

/**
 * Componente ImportantNoticeBanner del Design System
 * Banner destacado para avisos importantes
 */
export const ImportantNoticeBanner: React.FC<ImportantNoticeBannerProps> = ({
  title = 'Atención',
  content,
  variant = 'warning',
  className = '',
}) => {
  const variantClasses = {
    warning:
      'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/35 dark:text-amber-100',
    danger:
      'border-red-200 bg-red-50 text-red-950 dark:border-red-800/70 dark:bg-red-950/35 dark:text-red-100',
    info: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800/70 dark:bg-blue-950/35 dark:text-blue-100',
  };

  return (
    <div
      className={`${variantClasses[variant]} rounded-2xl border p-4 shadow-sm sm:p-5 ${className}`}
      role="status"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-current/10">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="mb-1.5 text-base font-black sm:text-lg">{title}</h3>
          <div
            className="prose prose-sm max-w-none text-current opacity-90 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content) }}
          />
        </div>
      </div>
    </div>
  );
};
