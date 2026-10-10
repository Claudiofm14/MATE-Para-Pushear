import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import {
  ColumnMapping,
  giteaImportService,
  StudentImportPreviewResponse,
  StudentImportResultResponse,
} from '../../services/gitea-import.service';
import { StudentImportFormatGuide } from '../StudentImportFormatGuide';
import { getApiErrorMessage } from '../../utils/api-error';

type Props = {
  open: boolean;
  onClose: () => void;
};

const emptyMapping: ColumnMapping = {};

export const ImportGiteaStudentsModal: React.FC<Props> = ({
  open,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<StudentImportPreviewResponse | null>(
    null
  );
  const [result, setResult] = useState<StudentImportResultResponse | null>(
    null
  );
  const [mapping, setMapping] = useState<ColumnMapping>(emptyMapping);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveMapping = useMemo(
    () => ({ ...(preview?.mapping || {}), ...mapping }),
    [preview?.mapping, mapping]
  );

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const resetAndClose = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setMapping(emptyMapping);
    setError(null);
    onClose();
  };

  const handlePreview = async () => {
    if (loading) return;

    if (!file) {
      setError('Selecciona un archivo .xls o .xlsx');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await giteaImportService.preview(file, effectiveMapping);
      setPreview(response);
      setMapping(response.mapping);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'No se pudo previsualizar la planilla'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (loading) return;

    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const response = await giteaImportService.confirm(file, effectiveMapping);
      setResult(response);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'No se pudo confirmar la importación'));
    } finally {
      setLoading(false);
    }
  };

  const downloadResultsCsv = () => {
    if (!result) return;
    const rows = [
      ['fila', 'email', 'username', 'estado', 'mensaje'],
      ...result.results.map(item => [
        item.rowNumber,
        item.email,
        item.username,
        item.status,
        item.message || '',
      ]),
    ];
    const csv = rows
      .map(row =>
        row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resultado-importacion-gitea.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const modal = (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-black/50 p-3 pt-6 sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/40 sm:max-h-[90dvh]">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-slate-700 sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-md bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Importar alumnos a Gitea
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-300">
                El archivo debe contener nombre, apellido, email y legajo/DNI.
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="shrink-0 rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            type="button"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
            La clave inicial será el legajo/DNI y Gitea pedirá cambiarla en el
            primer inicio. No se mostrarán ni guardarán contraseñas.
          </div>

          <StudentImportFormatGuide />

          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Archivo .xls o .xlsx
              </span>
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={event => {
                  setFile(event.target.files?.[0] || null);
                  setPreview(null);
                  setResult(null);
                  setError(null);
                }}
                className="block w-full rounded-md border border-gray-300 text-sm file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-gray-200 dark:border-slate-700 dark:bg-gray-950 dark:text-gray-100 dark:file:bg-gray-800 dark:file:text-gray-100"
              />
            </label>
            <button
              onClick={handlePreview}
              disabled={loading || !file}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              type="button"
            >
              <Upload className="h-4 w-4" />
              Previsualizar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !preview || preview.validRows === 0}
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              type="button"
            >
              Confirmar importación
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {preview?.missingColumns.length ? (
            <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/60 dark:bg-orange-950/40">
              <p className="mb-2 text-sm font-semibold text-orange-900 dark:text-orange-100">
                No se detectaron todas las columnas. Ajusta el mapeo manual.
              </p>
              <div className="grid gap-3 md:grid-cols-5">
                {(
                  [
                    'email',
                    'firstName',
                    'lastName',
                    'legajo',
                    'fullName',
                  ] as const
                ).map(key => (
                  <label
                    key={key}
                    className="text-xs font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {columnLabel(key)}
                    <select
                      value={(effectiveMapping as any)[key] || ''}
                      onChange={event =>
                        setMapping(prev => ({
                          ...prev,
                          [key]: event.target.value || undefined,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-gray-900"
                    >
                      <option value="">Sin mapear</option>
                      {preview.headers.map(header => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {preview && (
            <div className="mt-5">
              <div className="mb-3 grid gap-3 sm:grid-cols-3">
                <Summary label="Filas" value={preview.totalRows} />
                <Summary label="Validas" value={preview.validRows} />
                <Summary label="Invalidas" value={preview.invalidRows} />
              </div>
              <PreviewTable preview={preview} />
            </div>
          )}

          {result && (
            <div className="mt-5">
              <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="grid flex-1 gap-3 sm:grid-cols-4">
                  <Summary label="Total" value={result.total} />
                  <Summary label="Creados" value={result.created} />
                  <Summary label="Existentes" value={result.exists} />
                  <Summary label="Errores" value={result.failed} />
                </div>
                <button
                  onClick={downloadResultsCsv}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-100 dark:hover:bg-gray-800"
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
              </div>
              <ResultTable result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-300">
        {label}
      </div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function PreviewTable({ preview }: { preview: StudentImportPreviewResponse }) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-slate-700">
      <table className="min-w-[920px] w-full text-sm">
        <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600 dark:bg-slate-900 dark:text-slate-300">
          <tr>
            <th className="px-3 py-2">Fila</th>
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Apellido</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Legajo/DNI</th>
            <th className="px-3 py-2">Username</th>
            <th className="px-3 py-2">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {preview.items.map(item => (
            <tr key={item.rowNumber} className="dark:text-gray-100">
              <td className="px-3 py-2">{item.rowNumber}</td>
              <td className="px-3 py-2">{item.firstName}</td>
              <td className="px-3 py-2">{item.lastName}</td>
              <td className="px-3 py-2">{item.email}</td>
              <td className="px-3 py-2 font-mono">{item.legajoMasked}</td>
              <td className="px-3 py-2 font-mono">{item.username}</td>
              <td className="px-3 py-2">
                {item.valid ? (
                  <span className="font-semibold text-emerald-600">Valida</span>
                ) : (
                  <span className="font-semibold text-red-600">
                    {item.errors.join('; ')}
                  </span>
                )}
                {item.warnings.length > 0 && (
                  <div className="text-xs text-amber-600">
                    {item.warnings.join('; ')}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultTable({ result }: { result: StudentImportResultResponse }) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-slate-700">
      <table className="min-w-[760px] w-full text-sm">
        <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600 dark:bg-slate-900 dark:text-slate-300">
          <tr>
            <th className="px-3 py-2">Fila</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Username</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {result.results.map(item => (
            <tr
              key={`${item.rowNumber}-${item.username}`}
              className="dark:text-gray-100"
            >
              <td className="px-3 py-2">{item.rowNumber}</td>
              <td className="px-3 py-2">{item.email}</td>
              <td className="px-3 py-2 font-mono">{item.username}</td>
              <td className="px-3 py-2 font-semibold">
                {statusLabel(item.status)}
              </td>
              <td className="px-3 py-2">{item.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function columnLabel(key: keyof ColumnMapping) {
  const labels: Record<keyof ColumnMapping, string> = {
    email: 'Email',
    firstName: 'Nombre',
    lastName: 'Apellido',
    legajo: 'Legajo/DNI',
    fullName: 'Nombre completo',
  };
  return labels[key];
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    created: 'Creado',
    exists: 'Existente',
    error: 'Error',
    skipped: 'Omitido',
  };
  return labels[status] || status;
}
