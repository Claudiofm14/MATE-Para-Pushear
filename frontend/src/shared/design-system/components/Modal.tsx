import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    full: 'max-w-[calc(100vw-2rem)]',
  };

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="design-system-modal-title"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-start justify-center p-3 py-4 sm:items-center sm:p-4">
        <div
          className={`relative flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full ${sizeClasses[size]} animate-scale-in flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/25 dark:border-white/10 dark:bg-slate-950 sm:max-h-[90dvh]`}
        >
          {/* Header */}
          <div className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)] p-4 text-white dark:border-white/10 sm:p-6">
            <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(125,211,252,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,.06)_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="relative flex items-start justify-between gap-3">
              <h2
                id="design-system-modal-title"
                className="min-w-0 text-lg font-black leading-tight text-white sm:text-xl"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl border border-white/10 bg-white/10 p-2 text-white/80 transition-all hover:bg-white/15 hover:text-white active:scale-95 sm:rounded-2xl"
                aria-label="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
