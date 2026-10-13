import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth/contexts/AuthContext';
import { useStudentPreview } from '../../contexts/StudentPreviewContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useMateriaConfig } from '../../hooks/useMateriaConfig';
import { useToast } from '../../hooks/useToast';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { AvanceMapa } from '../../modules/avance/AvanceMapa';
import {
  avanceService,
  MapaAvance,
  recalcularAvance,
} from '../../services/avance.service';
import { cursadaService, Cursada } from '../../services/cursada.service';
import { usuarioService } from '../../services/usuario.service';
import { getApiErrorMessage } from '../../utils/api-error';

function MapaDeCursada({
  cursadaId,
  materiaId,
  comisionId,
}: {
  cursadaId: number;
  materiaId: number;
  comisionId?: number;
}) {
  const [mapa, setMapa] = useState<MapaAvance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const toast = useToast();
  const { config } = useMateriaConfig(materiaId);
  const mountedRef = useMounted();

  useEffect(() => {
    let cancelled = false;
    setError(null);
    avanceService
      .obtener(cursadaId, comisionId)
      .then(result => {
        if (result.materia.id !== materiaId)
          throw new Error('La cursada no pertenece a esta materia');
        if (!cancelled) setMapa(result);
      })
      .catch(err => {
        if (!cancelled)
          setError(getApiErrorMessage(err, 'No se pudo cargar el recorrido'));
      });
    return () => {
      cancelled = true;
    };
  }, [cursadaId, materiaId, comisionId, retry]);

  const complete = async (id: number) => {
    if (!mapa || saving) return false;
    const selected = mapa.nodos.find(nodo => nodo.id === id);
    if (!selected || selected.estado !== 'pendiente') return false;
    setSaving(true);
    try {
      const result = mapa.simulacion
        ? recalcularAvance({
            ...mapa,
            nodos: mapa.nodos.map(nodo =>
              nodo.id === id
                ? { ...nodo, completadoEn: new Date().toISOString() }
                : nodo
            ),
          })
        : await avanceService.completar(cursadaId, id);
      if (!mountedRef.current) return false;
      setMapa(result);
      toast.success('Entrega registrada en tu recorrido');
      return true;
    } catch (err) {
      if (mountedRef.current)
        toast.error(getApiErrorMessage(err, 'No se pudo guardar el avance'));
      return false;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const reset = async () => {
    if (!mapa || saving) return false;
    setSaving(true);
    try {
      const result = mapa.simulacion
        ? recalcularAvance({
            ...mapa,
            nodos: mapa.nodos.map(nodo => ({ ...nodo, completadoEn: null })),
          })
        : await avanceService.reiniciar(cursadaId);
      if (!mountedRef.current) return false;
      setMapa(result);
      toast.success('Recorrido reiniciado');
      return true;
    } catch (err) {
      if (mountedRef.current)
        toast.error(getApiErrorMessage(err, 'No se pudo reiniciar el avance'));
      return false;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  if (error)
    return (
      <div className="app-empty-state" role="alert">
        <p>{error}</p>
        <button
          type="button"
          className="avance-button-secondary mt-4"
          onClick={() => setRetry(value => value + 1)}
        >
          <RefreshCw size={16} /> Intentar de nuevo
        </button>
      </div>
    );
  if (!mapa) return <LoadingSpinner />;
  return (
    <AvanceMapa
      mapa={mapa}
      saving={saving}
      onComplete={complete}
      onReset={reset}
      titulo={config.pages.avance?.titulo}
      descripcion={config.pages.avance?.descripcion}
    />
  );
}

function useMounted() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

function CursadasAvance({
  materiaId,
  canManage,
}: {
  materiaId: number;
  canManage: boolean;
}) {
  const { selection } = useStudentPreview();
  const [cursadas, setCursadas] = useState<Cursada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const preview =
    canManage && selection?.materiaId === materiaId ? selection : null;
  const previewCursadaId = preview?.cursadaId;
  const requestedId = Number(searchParams.get('cursadaId'));
  const cursada =
    cursadas.find(item => item.id === (preview?.cursadaId || requestedId)) ||
    cursadas.find(item => item.activa) ||
    cursadas[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      cursadaService.getByMateria(materiaId),
      canManage
        ? Promise.resolve(null)
        : usuarioService.obtenerMateriasAprobadas(),
    ])
      .then(([available, inscripciones]) => {
        const allowed = inscripciones
          ? new Set(
              inscripciones
                .filter(item => item.materiaId === materiaId)
                .map(item => item.comision?.cursada?.id)
            )
          : null;
        const result = available.filter(
          item =>
            (!allowed || allowed.has(item.id)) &&
            (!previewCursadaId || item.id === previewCursadaId)
        );
        if (!cancelled) setCursadas(result);
      })
      .catch(err => {
        if (!cancelled)
          setError(
            getApiErrorMessage(err, 'No se pudieron cargar las cursadas')
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [materiaId, canManage, previewCursadaId, retry]);

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="app-empty-state" role="alert">
        <p>{error}</p>
        <button
          type="button"
          className="avance-button-secondary mt-4"
          onClick={() => setRetry(value => value + 1)}
        >
          Intentar de nuevo
        </button>
      </div>
    );
  if (!cursada)
    return (
      <div className="app-empty-state">
        <BookOpen size={36} />
        <h1 className="mt-4 text-xl font-bold">
          No hay una cursada disponible
        </h1>
        <p className="mt-2">
          Necesitás una inscripción aprobada para ver tu recorrido.
        </p>
        <Link
          className="mt-5 font-bold text-emerald-600"
          to={`/materia/${materiaId}/semanas`}
        >
          Ver cursadas e inscribirme
        </Link>
      </div>
    );
  return (
    <>
      {(cursadas.length > 1 || preview) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {cursada.titulo}
            </p>
            {preview && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {preview.comisionNombre}
              </p>
            )}
          </div>
          {cursadas.length > 1 && (
            <label className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Cursada
              <select
                className="app-form-control max-w-72"
                aria-label="Seleccionar cursada"
                value={cursada.id}
                onChange={event => {
                  const params = new URLSearchParams(searchParams);
                  params.set('cursadaId', event.target.value);
                  setSearchParams(params);
                }}
              >
                {cursadas.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.titulo}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
      <MapaDeCursada
        key={`${cursada.id}:${preview?.comisionId || 'propia'}`}
        cursadaId={cursada.id}
        materiaId={materiaId}
        comisionId={preview?.comisionId}
      />
    </>
  );
}

export default function AvanceCursadaPage() {
  const { id } = useParams<{ id: string }>();
  const materiaId = Number(id);
  const { authenticated, isInitialized, login } = useAuth();
  const { actualCanManageCurrentMateria, loadingPermissions } =
    usePermissions();
  if (!isInitialized || loadingPermissions) return <LoadingSpinner />;
  return (
    <div className="app-page">
      <div className="app-page-container avance-page-container">
        {!Number.isInteger(materiaId) || materiaId <= 0 ? (
          <p role="alert">Materia no válida</p>
        ) : !authenticated ? (
          <div className="app-empty-state">
            <h1 className="text-xl font-bold">
              Ingresá para ver tu avance de cursada
            </h1>
            <button
              type="button"
              className="avance-button-primary mt-5"
              onClick={() => login(`/materia/${materiaId}/avance`)}
            >
              Ingresar
            </button>
          </div>
        ) : (
          <CursadasAvance
            key={materiaId}
            materiaId={materiaId}
            canManage={actualCanManageCurrentMateria}
          />
        )}
      </div>
    </div>
  );
}
