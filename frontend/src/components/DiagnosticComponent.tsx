import React, { useEffect, useState } from 'react';
import { RefreshCw, Wrench } from 'lucide-react';
import { apiService } from '../shared/services/api.service';

export const DiagnosticComponent: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>(
    'checking'
  );
  const [apiMessage, setApiMessage] = useState<string>('Verificando...');

  const checkBackendHealth = async () => {
    try {
      setApiStatus('checking');
      setApiMessage('Conectando con el backend...');

      const response = await apiService.get<{
        status: string;
        timestamp: string;
      }>('/health');

      setApiStatus('ok');
      setApiMessage(`Backend conectado - Status: ${response.status}`);
    } catch (error: any) {
      setApiStatus('error');

      if (error.message.includes('No se pudo conectar')) {
        setApiMessage(
          'Backend no está corriendo. Ejecutá npm run start:dev en backend.'
        );
      } else {
        setApiMessage(`Error: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-2 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
        <Wrench className="h-5 w-5 text-emerald-500" />
        Diagnóstico del sistema
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex items-start">
          <span
            className={`mr-2 mt-1 inline-block h-3 w-3 rounded-full ${
              apiStatus === 'ok'
                ? 'bg-green-500'
                : apiStatus === 'error'
                  ? 'bg-red-500'
                  : 'animate-pulse bg-yellow-500'
            }`}
          />
          <div className="flex-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Backend API:
            </p>
            <p className="text-slate-600 dark:text-slate-400">{apiMessage}</p>
          </div>
        </div>

        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong>API URL:</strong>{' '}
            {import.meta.env.VITE_API_URL || 'http://localhost:3000'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong>Materia ID:</strong>{' '}
            {import.meta.env.VITE_MATERIA_ID || '1'}
          </p>
        </div>

        <button
          onClick={checkBackendHealth}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
        >
          <RefreshCw className="h-4 w-4" />
          Volver a verificar
        </button>
      </div>
    </div>
  );
};

export default DiagnosticComponent;
