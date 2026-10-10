import { useEffect, useState } from 'react';
import { Eye, GraduationCap, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStudentPreview } from '../contexts/StudentPreviewContext';
import { useMateriaCursada } from '../hooks/useMateriaCursada';
import { usePermissions } from '../hooks/usePermissions';
import { Comision, comisionService } from '../services/comision.service';

interface StudentPreviewMenuProps {
  open: boolean;
  onClose: () => void;
}

export function StudentPreviewMenu({ open, onClose }: StudentPreviewMenuProps) {
  const location = useLocation();
  const materiaMatch = location.pathname.match(/^\/materia\/(\d+)/);
  const materiaId = materiaMatch ? Number(materiaMatch[1]) : null;
  const { actualCanManageCurrentMateria, loadingPermissions } =
    usePermissions();
  const { cursada } = useMateriaCursada(materiaId);
  const { selection, isPreviewing, startPreview, stopPreview } =
    useStudentPreview();
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!open || !actualCanManageCurrentMateria || !cursada || isPreviewing) {
      return;
    }

    setLoading(true);
    comisionService
      .getByCursada(cursada.id)
      .then(items => {
        if (!cancelled) setComisiones(items);
      })
      .catch(() => {
        if (!cancelled) setComisiones([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [actualCanManageCurrentMateria, cursada, isPreviewing, open]);

  if (
    !materiaId ||
    loadingPermissions ||
    !actualCanManageCurrentMateria ||
    !cursada
  ) {
    return null;
  }

  if (isPreviewing) {
    return (
      <li className="border-b border-gray-100 px-3 py-3 dark:border-gray-700">
        <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          <Eye className="h-4 w-4" aria-hidden="true" />
          Vista como alumno
        </div>
        <div className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
          {selection?.comisionNombre}
        </div>
        <button
          type="button"
          onClick={() => {
            stopPreview();
            onClose();
          }}
          className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <X className="mr-3 h-4 w-4" aria-hidden="true" />
          Salir de la vista de alumno
        </button>
      </li>
    );
  }

  return (
    <li className="border-b border-gray-100 px-3 py-3 dark:border-gray-700">
      <label className="block">
        <span className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          Vista como alumno
        </span>
        <select
          aria-label="Seleccionar comisión para vista de alumno"
          value=""
          disabled={loading}
          onChange={event => {
            const comision = comisiones.find(
              item => item.id === Number(event.target.value)
            );
            if (!comision) return;
            startPreview({
              materiaId,
              cursadaId: cursada.id,
              comisionId: comision.id,
              comisionNombre: comision.nombre,
            });
            onClose();
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 disabled:cursor-wait disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          <option value="">
            {loading
              ? 'Cargando comisiones…'
              : comisiones.length
                ? 'Elegir comisión…'
                : 'No hay comisiones disponibles'}
          </option>
          {comisiones.map(comision => (
            <option key={comision.id} value={comision.id}>
              {comision.nombre}
            </option>
          ))}
        </select>
      </label>
    </li>
  );
}
