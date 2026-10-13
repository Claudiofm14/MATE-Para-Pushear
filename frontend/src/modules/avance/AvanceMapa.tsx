import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCode2,
  FileText,
  LockKeyhole,
  RotateCcw,
  Route,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { MapaAvance, NodoAvance } from '../../services/avance.service';
import { sanitizeRichHtml } from '../../shared/utils/htmlSanitizer';
import './avance.css';

interface AvanceMapaProps {
  mapa: MapaAvance;
  saving: boolean;
  titulo?: string;
  descripcion?: string;
  onComplete: (id: number) => Promise<boolean>;
  onReset: () => Promise<boolean>;
}

const NODE_WIDTH = 256;
const NODE_HEIGHT = 160;
const COLUMN_GAP = 80;
const ROW_GAP = 104;
const stateLabels = {
  entregado: 'Entregado',
  pendiente: 'Pendiente',
  bloqueado: 'Bloqueado',
};

function formatDate(value?: string) {
  if (!value) return 'Sin fecha límite';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Sin fecha límite';
  const parts = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(date);
  return parts
    .filter(part => part.type !== 'literal')
    .map(part => part.value.replace('.', ''))
    .join(' ');
}

function safeResourceUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function makeLayout(nodos: NodoAvance[]) {
  const groups = new Map<number, NodoAvance[]>();
  for (const nodo of nodos) {
    const group = groups.get(nodo.semanaId) || [];
    group.push(nodo);
    groups.set(nodo.semanaId, group);
  }
  const maxRows = Math.max(
    1,
    ...Array.from(groups.values(), group => group.length)
  );
  const height = Math.max(
    500,
    maxRows * NODE_HEIGHT + (maxRows - 1) * ROW_GAP + 120
  );
  const positions = new Map<number, { x: number; y: number }>();
  const root = { x: 96, y: (height - NODE_HEIGHT) / 2 };
  Array.from(groups.values()).forEach((group, column) => {
    const groupHeight =
      group.length * NODE_HEIGHT + (group.length - 1) * ROW_GAP;
    group.forEach((nodo, row) =>
      positions.set(nodo.id, {
        x: root.x + (column + 1) * (NODE_WIDTH + COLUMN_GAP),
        y: (height - groupHeight) / 2 + row * (NODE_HEIGHT + ROW_GAP),
      })
    );
  });
  return {
    root,
    height,
    width: root.x * 2 + NODE_WIDTH + groups.size * (NODE_WIDTH + COLUMN_GAP),
    positions,
  };
}

export function AvanceMapa({
  mapa,
  saving,
  titulo,
  descripcion,
  onComplete,
  onReset,
}: AvanceMapaProps) {
  const [zoom, setZoom] = useState(0.75);
  const [selectedId, setSelectedId] = useState<
    number | 'inicio' | 'reiniciar' | null
  >(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; scrollLeft: number } | null>(null);
  const dialogTitleId = useId();
  const selected = mapa.nodos.find(nodo => nodo.id === selectedId);
  const completed = mapa.nodos.filter(
    nodo => nodo.estado === 'entregado'
  ).length;
  const percentage = mapa.nodos.length
    ? Math.round((completed / mapa.nodos.length) * 100)
    : 0;
  const layout = makeLayout(mapa.nodos);
  const resourceUrl = safeResourceUrl(selected?.recursoUrl);
  const nodesById = new Map(mapa.nodos.map(nodo => [nodo.id, nodo]));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selectedId === null || !dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [selectedId]);

  const closeDialog = () => {
    if (!saving) setSelectedId(null);
  };
  const completeSelected = async () => {
    if (selected && (await onComplete(selected.id))) setSelectedId(null);
  };
  const reset = async () => {
    if (await onReset()) setSelectedId(null);
  };

  return (
    <div className="avance-content">
      <section className="avance-hero" aria-labelledby="avance-title">
        <div>
          <span className="avance-eyebrow">
            <Sparkles size={16} aria-hidden="true" /> CAMPUS TECNOLÓGICO
          </span>
          <h1 id="avance-title">{titulo || 'Avance de Cursada'}</h1>
          <p>
            {descripcion ||
              'Visualizá el mapa de la materia. Las actividades y trabajos prácticos se irán habilitando a medida que completes cada entrega.'}
          </p>
        </div>
        <div className="avance-progress-card">
          <div className="avance-progress-label">
            <span>Progreso general</span>
            <strong>{percentage}%</strong>
          </div>
          <progress
            aria-label="Progreso general de la cursada"
            max={100}
            value={percentage}
          />
          <div className="avance-progress-footer">
            <span aria-live="polite">
              Completadas:{' '}
              <strong>
                {completed} / {mapa.nodos.length}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedId('reiniciar')}
              disabled={saving || completed === 0}
            >
              <RotateCcw size={14} aria-hidden="true" /> Reiniciar
            </button>
          </div>
        </div>
      </section>

      {mapa.simulacion && (
        <p className="avance-simulation">
          <Sparkles size={16} aria-hidden="true" /> Simulación docente: podés
          probar las entregas y el desbloqueo del recorrido.
        </p>
      )}

      <section className="avance-map-panel" aria-labelledby="avance-map-title">
        <div className="avance-map-header">
          <div>
            <h2 id="avance-map-title">Ruta de Aprendizaje y Entregas</h2>
            <p>Desplazate horizontalmente para explorar las semanas</p>
          </div>
          <span className="avance-interactive">
            <Route size={15} aria-hidden="true" /> Nodos interactivos
          </span>
        </div>
        {mapa.nodos.length === 0 ? (
          <div className="avance-empty">
            <BookOpen size={36} aria-hidden="true" />
            <h3>Todavía no hay actividades disponibles</h3>
            <p>
              El recorrido aparecerá cuando se publiquen actividades para tu
              cursada y comisión.
            </p>
            <Link to={`/materia/${mapa.materia.id}/semanas`}>
              Ir a las semanas
            </Link>
          </div>
        ) : (
          <div className="avance-map-frame">
            <div
              className="avance-scroll"
              ref={scrollRef}
              tabIndex={0}
              role="region"
              aria-label="Mapa de actividades, con desplazamiento horizontal"
              onPointerDown={event => {
                if (
                  event.pointerType !== 'mouse' ||
                  event.button !== 0 ||
                  (event.target as HTMLElement).closest('button')
                )
                  return;
                dragRef.current = {
                  x: event.clientX,
                  scrollLeft: event.currentTarget.scrollLeft,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={event => {
                if (dragRef.current)
                  event.currentTarget.scrollLeft =
                    dragRef.current.scrollLeft +
                    dragRef.current.x -
                    event.clientX;
              }}
              onPointerUp={() => {
                dragRef.current = null;
              }}
              onPointerCancel={() => {
                dragRef.current = null;
              }}
            >
              <div
                className="avance-scaled-area"
                style={{
                  width: layout.width * zoom,
                  height: layout.height * zoom,
                }}
              >
                <div
                  className="avance-canvas"
                  style={{
                    width: layout.width,
                    height: layout.height,
                    transform: `scale(${zoom})`,
                  }}
                >
                  <svg
                    className="avance-connections"
                    width={layout.width}
                    height={layout.height}
                    aria-hidden="true"
                  >
                    {mapa.nodos.flatMap(nodo => {
                      const target = layout.positions.get(nodo.id)!;
                      const sources = nodo.requisitos.length
                        ? nodo.requisitos
                        : ['inicio' as const];
                      return sources.map(sourceId => {
                        const source =
                          sourceId === 'inicio'
                            ? layout.root
                            : layout.positions.get(sourceId);
                        if (!source) return null;
                        const done =
                          sourceId === 'inicio' ||
                          nodesById.get(sourceId)?.estado === 'entregado';
                        const x1 = source.x + NODE_WIDTH,
                          y1 = source.y + NODE_HEIGHT / 2;
                        const x2 = target.x,
                          y2 = target.y + NODE_HEIGHT / 2;
                        const path = `M ${x1} ${y1} C ${x1 + COLUMN_GAP / 2} ${y1}, ${x2 - COLUMN_GAP / 2} ${y2}, ${x2} ${y2}`;
                        return (
                          <g key={`${sourceId}-${nodo.id}`}>
                            <path
                              key={`${sourceId}-${nodo.id}`}
                              className={`avance-edge ${done ? 'avance-edge-active' : ''}`}
                              d={path}
                            />
                            {done && (
                              <circle className="avance-edge-pulse" r="3">
                                <animateMotion
                                  dur="3s"
                                  repeatCount="indefinite"
                                  path={path}
                                />
                              </circle>
                            )}
                          </g>
                        );
                      });
                    })}
                  </svg>
                  <button
                    type="button"
                    className="avance-node avance-node-root"
                    style={{ left: layout.root.x, top: layout.root.y }}
                    onClick={() => setSelectedId('inicio')}
                  >
                    <span className="avance-node-top">
                      <span>INICIO</span>
                      <span className="avance-state">
                        <BookOpen size={14} aria-hidden="true" /> Tu recorrido
                      </span>
                    </span>
                    <span className="avance-node-main">
                      <span className="avance-node-icon">
                        <BookOpen size={25} aria-hidden="true" />
                      </span>
                      <strong>{mapa.materia.nombre}</strong>
                    </span>
                    <span className="avance-node-bottom">
                      {mapa.materia.codigo || mapa.cursada.titulo}
                    </span>
                  </button>
                  {mapa.nodos.map(nodo => {
                    const position = layout.positions.get(nodo.id)!;
                    const StatusIcon =
                      nodo.estado === 'entregado'
                        ? CheckCircle2
                        : nodo.estado === 'bloqueado'
                          ? LockKeyhole
                          : Clock3;
                    const NodeIcon =
                      nodo.tipoActividad === 'programacion'
                        ? FileCode2
                        : FileText;
                    const pendingRequirements = nodo.requisitos
                      .filter(id => nodesById.get(id)?.estado !== 'entregado')
                      .map(id => nodesById.get(id)?.titulo)
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <button
                        type="button"
                        key={nodo.id}
                        className={`avance-node avance-node-${nodo.estado}`}
                        style={{ left: position.x, top: position.y }}
                        aria-label={`${nodo.titulo} — ${stateLabels[nodo.estado]}`}
                        aria-disabled={nodo.estado === 'bloqueado'}
                        title={
                          nodo.estado === 'bloqueado'
                            ? `Completá primero: ${pendingRequirements}`
                            : nodo.titulo
                        }
                        onClick={() => {
                          if (nodo.estado !== 'bloqueado')
                            setSelectedId(nodo.id);
                        }}
                      >
                        <span className="avance-node-top">
                          <span>SEMANA {nodo.numeroSemana}</span>
                          <span className="avance-state">
                            <StatusIcon size={14} aria-hidden="true" />
                            {stateLabels[nodo.estado]}
                          </span>
                        </span>
                        <span className="avance-node-main">
                          <span className="avance-node-icon">
                            <NodeIcon size={25} aria-hidden="true" />
                          </span>
                          <strong>{nodo.titulo}</strong>
                        </span>
                        <span className="avance-node-bottom">
                          <span>
                            SEM-{String(nodo.numeroSemana).padStart(2, '0')}
                          </span>
                          <span>{formatDate(nodo.fechaEntrega)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div
              className="avance-zoom"
              role="group"
              aria-label="Controles de zoom del mapa"
            >
              <button
                type="button"
                aria-label="Acercar mapa"
                disabled={zoom >= 1.5}
                onClick={() =>
                  setZoom(current => Math.min(1.5, current + 0.125))
                }
              >
                <ZoomIn size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="avance-zoom-value"
                aria-label="Restablecer zoom al 75%"
                onClick={() => setZoom(0.75)}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                aria-label="Alejar mapa"
                disabled={zoom <= 0.5}
                onClick={() =>
                  setZoom(current => Math.max(0.5, current - 0.125))
                }
              >
                <ZoomOut size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        <div className="avance-legend">
          <span>
            <CheckCircle2 size={15} aria-hidden="true" /> Entregado
          </span>
          <span>
            <Clock3 size={15} aria-hidden="true" /> Pendiente
          </span>
          <span>
            <LockKeyhole size={15} aria-hidden="true" /> Bloqueado: completá los
            pasos conectados anteriores
          </span>
        </div>
      </section>

      {createPortal(
        <dialog
          className="avance-dialog"
          ref={dialogRef}
          aria-labelledby={dialogTitleId}
          onCancel={event => {
            event.preventDefault();
            closeDialog();
          }}
          onClick={event => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div className="avance-dialog-body">
            <button
              type="button"
              className="avance-dialog-close"
              aria-label="Cerrar detalles"
              disabled={saving}
              onClick={closeDialog}
              autoFocus
            >
              <X size={22} aria-hidden="true" />
            </button>
            <div className="avance-dialog-heading">
              <span className="avance-node-icon">
                {selectedId === 'reiniciar' ? (
                  <RotateCcw size={26} aria-hidden="true" />
                ) : selected ? (
                  <FileText size={26} aria-hidden="true" />
                ) : (
                  <BookOpen size={26} aria-hidden="true" />
                )}
              </span>
              <div>
                <span className="avance-eyebrow">
                  {selected
                    ? `SEMANA ${selected.numeroSemana}`
                    : selectedId === 'reiniciar'
                      ? 'TU AVANCE'
                      : 'INICIO'}
                </span>
                <h2 id={dialogTitleId}>
                  {selected?.titulo ||
                    (selectedId === 'reiniciar'
                      ? 'Reiniciar el recorrido'
                      : mapa.materia.nombre)}
                </h2>
              </div>
            </div>
            <h3>
              {selectedId === 'reiniciar'
                ? 'VOLVER A EMPEZAR'
                : 'DESCRIPCIÓN DEL TRABAJO'}
            </h3>
            <div className="avance-dialog-description">
              {selected ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichHtml(
                      selected.descripcion ||
                        'Consultá el contenido de la semana para ver las instrucciones.'
                    ),
                  }}
                />
              ) : (
                <p>
                  {selectedId === 'reiniciar'
                    ? 'Se quitarán las marcas de entrega de este recorrido. Podés volver a completar las actividades desde el inicio. Las calificaciones y los trabajos enviados se conservan.'
                    : `Recorré las actividades de ${mapa.cursada.titulo}. Completá cada entrega para habilitar los siguientes pasos conectados.`}
                </p>
              )}
            </div>
            {selected && (
              <div className="avance-dialog-date">
                <span>
                  <CalendarDays size={18} aria-hidden="true" /> Fecha límite de
                  entrega
                </span>
                <strong>{formatDate(selected.fechaEntrega)}</strong>
              </div>
            )}
            {selected && (
              <div className="avance-dialog-links">
                {resourceUrl && (
                  <a
                    href={resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    {selected.recursoTitulo || 'Abrir recurso de la actividad'}
                  </a>
                )}
                <Link
                  to={`/materia/${mapa.materia.id}/semanas/${selected.semanaId}`}
                >
                  <BookOpen size={16} aria-hidden="true" /> Ver la semana
                </Link>
              </div>
            )}
            {selected && !mapa.simulacion && (
              <p className="avance-delivery-help">
                Esta marca registra tu avance personal. Entregá el trabajo por
                el medio indicado por la cátedra.
              </p>
            )}
            <div className="avance-dialog-actions">
              <button
                type="button"
                className="avance-button-secondary"
                disabled={saving}
                onClick={closeDialog}
              >
                {selectedId === 'inicio' ? 'Cerrar' : 'Cancelar'}
              </button>
              {selectedId === 'reiniciar' ? (
                <button
                  type="button"
                  className="avance-button-primary"
                  disabled={saving}
                  onClick={reset}
                >
                  <RotateCcw size={17} aria-hidden="true" />
                  {saving ? 'Reiniciando…' : 'Reiniciar avance'}
                </button>
              ) : (
                selected && (
                  <button
                    type="button"
                    className="avance-button-primary"
                    disabled={saving || selected.estado === 'entregado'}
                    onClick={completeSelected}
                  >
                    <Check size={18} aria-hidden="true" />
                    {saving
                      ? 'Guardando…'
                      : selected.estado === 'entregado'
                        ? 'Entregado correctamente'
                        : 'Marcar como entregado'}
                  </button>
                )
              )}
            </div>
          </div>
        </dialog>,
        document.body
      )}
    </div>
  );
}
