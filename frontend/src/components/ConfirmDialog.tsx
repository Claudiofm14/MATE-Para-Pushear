import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../shared/design-system/components/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const normalizeMojibake = (value: string) =>
  value
    .replaceAll('\u00c2\u00bf', '\u00bf')
    .replaceAll('\u00c2\u00a1', '\u00a1')
    .replaceAll('\u00c3\u00a1', '\u00e1')
    .replaceAll('\u00c3\u00a9', '\u00e9')
    .replaceAll('\u00c3\u00ad', '\u00ed')
    .replaceAll('\u00c3\u00b3', '\u00f3')
    .replaceAll('\u00c3\u00ba', '\u00fa')
    .replaceAll('\u00c3\u00b1', '\u00f1')
    .replaceAll('\u00c3\u0081', '\u00c1')
    .replaceAll('\u00c3\u0089', '\u00c9')
    .replaceAll('\u00c3\u008d', '\u00cd')
    .replaceAll('\u00c3\u0093', '\u00d3')
    .replaceAll('\u00c3\u009a', '\u00da')
    .replaceAll('\u00c3\u0091', '\u00d1')
    .replaceAll('\u00c3\u201a\u00c2\u00bf', '\u00bf')
    .replaceAll('\u00c3\u201a\u00c2\u00a1', '\u00a1')
    .replaceAll('\u00c3\u201a\u00c3\u0192\u00c2\u00a1', '\u00e1')
    .replaceAll('\u00c3\u201a\u00c3\u0192\u00c2\u00a9', '\u00e9')
    .replaceAll('\u00c3\u201a\u00c3\u0192\u00c2\u00ad', '\u00ed')
    .replaceAll('\u00c3\u201a\u00c3\u0192\u00c2\u00b3', '\u00f3')
    .replaceAll('\u00c3\u201a\u00c3\u0192\u00c2\u00ba', '\u00fa')
    .replaceAll('\u00c3\u201a\u00c3\u0192\u00c2\u00b1', '\u00f1')
    .replaceAll('\u00c3\u0192\u00c2\u00a1', '\u00e1')
    .replaceAll('\u00c3\u0192\u00c2\u00a9', '\u00e9')
    .replaceAll('\u00c3\u0192\u00c2\u00ad', '\u00ed')
    .replaceAll('\u00c3\u0192\u00c2\u00b3', '\u00f3')
    .replaceAll('\u00c3\u0192\u00c2\u00ba', '\u00fa')
    .replaceAll('\u00c3\u0192\u00c2\u00b1', '\u00f1');

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const variantColors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  const iconColors = {
    danger: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
  };

  const iconBackgroundColors = {
    danger: 'bg-red-100 dark:bg-red-900/20',
    warning: 'bg-amber-100 dark:bg-amber-900/20',
    info: 'bg-blue-100 dark:bg-blue-900/20',
  };

  const displayTitle = normalizeMojibake(title);
  const displayMessage = normalizeMojibake(message);

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative w-full max-w-lg transform overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-2xl transition-all dark:border-white/10 dark:bg-slate-900"
      >
        <div className="bg-white px-4 pb-4 pt-5 dark:bg-gray-800 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div
              className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${iconBackgroundColors[variant]} sm:mx-0 sm:h-10 sm:w-10`}
            >
              <svg
                className={`h-6 w-6 ${iconColors[variant]}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3
                id="confirm-dialog-title"
                className="text-lg font-black leading-6 text-slate-950 dark:text-white"
              >
                {displayTitle}
              </h3>
              <div className="mt-2">
                <p
                  id="confirm-dialog-description"
                  className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  {displayMessage}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-slate-950/60 sm:flex-row-reverse sm:px-6">
          <Button
            variant="primary"
            onClick={onConfirm}
            className={`w-full sm:w-auto ${variantColors[variant]}`}
          >
            {confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
        </div>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ConfirmDialog;
