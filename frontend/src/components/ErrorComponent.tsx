import React from 'react';

interface ErrorComponentProps {
  error?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorComponent: React.FC<ErrorComponentProps> = ({
  error,
  message,
  onRetry,
  className = '',
}) => {
  const errorMessage = message || error || 'Ha ocurrido un error inesperado';

  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white/95 p-8 text-center shadow-2xl shadow-slate-950/10 dark:border-red-900/40 dark:bg-slate-900/90">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-6 w-6 text-red-600 dark:text-red-500"
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

        <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
          Error al cargar el contenido
        </h3>

        <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          {errorMessage}
        </p>

        {onRetry && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center rounded-2xl border border-transparent bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:text-white"
            >
              <svg
                className="mr-2 -ml-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
