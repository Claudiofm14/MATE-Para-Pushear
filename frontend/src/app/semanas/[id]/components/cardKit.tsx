import React from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';

/**
 * Primitivas compartidas por las tarjetas de la vista de semana
 * (ejercicios, horarios y videos).
 *
 * La intencion es que las tres tarjetas se lean como piezas del mismo
 * sistema: mismos radios, misma altura de accion, mismo tratamiento de foco
 * y el mismo acento de color segun la naturaleza del contenido.
 */

export type Accent = 'emerald' | 'sky' | 'amber' | 'violet' | 'blue' | 'slate';

type AccentTokens = {
  /** Barra superior de la tarjeta. */
  rail: string;
  /** Contenedor del icono principal. */
  icon: string;
  /** Chip de categoria. */
  chip: string;
  /** Boton solido: reservado para la unica accion primaria de la tarjeta. */
  solid: string;
  /** Boton suave: acciones secundarias. */
  soft: string;
  /** Anillo de foco accesible. */
  ring: string;
};

export const ACCENTS: Record<Accent, AccentTokens> = {
  emerald: {
    rail: 'from-emerald-400 to-teal-500',
    icon: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25',
    chip: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25',
    solid:
      'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-950/20',
    soft: 'bg-emerald-500/[0.07] text-emerald-700 ring-1 ring-emerald-500/15 hover:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20 dark:hover:bg-emerald-400/15',
    ring: 'focus-visible:ring-emerald-500/60',
  },
  sky: {
    rail: 'from-sky-400 to-cyan-500',
    icon: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25',
    chip: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25',
    solid:
      'bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 shadow-lg shadow-sky-950/20',
    soft: 'bg-sky-500/[0.07] text-sky-700 ring-1 ring-sky-500/15 hover:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/20 dark:hover:bg-sky-400/15',
    ring: 'focus-visible:ring-sky-500/60',
  },
  amber: {
    rail: 'from-amber-400 to-orange-500',
    icon: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25',
    chip: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25',
    solid:
      'bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 shadow-lg shadow-amber-950/20',
    soft: 'bg-amber-500/[0.07] text-amber-700 ring-1 ring-amber-500/15 hover:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20 dark:hover:bg-amber-400/15',
    ring: 'focus-visible:ring-amber-500/60',
  },
  violet: {
    rail: 'from-violet-400 to-fuchsia-500',
    icon: 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25',
    chip: 'bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25',
    solid:
      'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700 shadow-lg shadow-violet-950/20',
    soft: 'bg-violet-500/[0.07] text-violet-700 ring-1 ring-violet-500/15 hover:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20 dark:hover:bg-violet-400/15',
    ring: 'focus-visible:ring-violet-500/60',
  },
  blue: {
    rail: 'from-blue-400 to-indigo-500',
    icon: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25',
    chip: 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25',
    solid:
      'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-950/20',
    soft: 'bg-blue-500/[0.07] text-blue-700 ring-1 ring-blue-500/15 hover:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20 dark:hover:bg-blue-400/15',
    ring: 'focus-visible:ring-blue-500/60',
  },
  slate: {
    rail: 'from-slate-300 to-slate-400',
    icon: 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10',
    chip: 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/15 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10',
    solid:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-lg shadow-slate-950/20 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200',
    soft: 'bg-slate-500/[0.07] text-slate-700 ring-1 ring-slate-500/15 hover:bg-slate-500/15 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10',
    ring: 'focus-visible:ring-slate-500/60',
  },
};

export const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950';

/** Superficie base de cualquier tarjeta de la semana. */
export const CARD_SURFACE =
  'group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-950/[0.03] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/10 dark:border-white/[0.08] dark:bg-slate-900/80 dark:shadow-black/20 dark:hover:shadow-black/40';

/** Barra de acento superior: aparece al enfocar o pasar el mouse. */
export const CardRail: React.FC<{ accent: Accent }> = ({ accent }) => (
  <span
    aria-hidden="true"
    className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${ACCENTS[accent].rail} opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100`}
  />
);

/** Chip de categoria o estado. */
export const Chip: React.FC<{
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, children, className = '' }) => (
  <span
    className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ${className}`}
  >
    {icon}
    <span className="truncate">{children}</span>
  </span>
);

type ActionVisual = {
  variant?: 'solid' | 'soft' | 'ghost';
  accent?: Accent;
};

const ACTION_BASE =
  'inline-flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55';

const visualClasses = ({
  variant = 'soft',
  accent = 'slate',
}: ActionVisual) => {
  const tokens = ACCENTS[accent];
  if (variant === 'solid') return `${tokens.solid} ${tokens.ring}`;
  if (variant === 'ghost')
    return `text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/[0.06] ${tokens.ring}`;
  return `${tokens.soft} ${tokens.ring}`;
};

/** Enlace de accion. Abre en pestana nueva y no propaga el click. */
export const ActionLink: React.FC<
  ActionVisual & {
    href?: string;
    icon: React.ReactNode;
    label: string;
    hint?: string;
  }
> = ({ href, icon, label, hint, variant, accent }) => {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={event => event.stopPropagation()}
      title={hint || label}
      className={`${ACTION_BASE} ${visualClasses({ variant, accent })} ${FOCUS_RING}`}
    >
      <span className="inline-flex min-w-0 items-center gap-2.5">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 opacity-70" />
    </a>
  );
};

/** Boton de accion con estado de carga integrado. */
export const ActionButton: React.FC<
  ActionVisual & {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    trailing?: React.ReactNode;
    title?: string;
  }
> = ({
  icon,
  label,
  onClick,
  loading = false,
  disabled = false,
  trailing,
  title,
  variant,
  accent,
}) => (
  <button
    type="button"
    onClick={event => {
      event.stopPropagation();
      onClick();
    }}
    disabled={disabled || loading}
    title={title || label}
    aria-busy={loading || undefined}
    className={`${ACTION_BASE} ${visualClasses({ variant, accent })} ${FOCUS_RING}`}
  >
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <span className="shrink-0">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </span>
      <span className="truncate">{label}</span>
    </span>
    {trailing}
  </button>
);

/**
 * Acciones de docente. Se muestran atenuadas y toman color al acercarse,
 * para que no compitan visualmente con la accion principal del alumno.
 */
export const TeacherActions: React.FC<{
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}> = ({ canEdit, canDelete, onEdit, onDelete, editLabel, deleteLabel }) => {
  if (!canEdit && !canDelete) return null;

  const buttonBase = `inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 transition-all duration-200 ${FOCUS_RING}`;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {canEdit && (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onEdit();
          }}
          title={editLabel}
          aria-label={editLabel}
          className={`${buttonBase} text-slate-500 ring-slate-200 hover:bg-blue-500/10 hover:text-blue-600 hover:ring-blue-500/30 focus-visible:ring-blue-500/60 dark:text-slate-400 dark:ring-white/10 dark:hover:bg-blue-400/10 dark:hover:text-blue-300 dark:hover:ring-blue-400/30`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onDelete();
          }}
          title={deleteLabel}
          aria-label={deleteLabel}
          className={`${buttonBase} text-slate-500 ring-slate-200 hover:bg-red-500/10 hover:text-red-600 hover:ring-red-500/30 focus-visible:ring-red-500/60 dark:text-slate-400 dark:ring-white/10 dark:hover:bg-red-400/10 dark:hover:text-red-300 dark:hover:ring-red-400/30`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

/** Bloque `git clone` con copia al portapapeles. */
export const CloneCommand: React.FC<{ url: string }> = ({ url }) => {
  const [copied, setCopied] = React.useState(false);
  const command = `git clone ${url}`;

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      // Sin permiso de portapapeles el usuario todavia puede seleccionar el texto.
    }
  };

  return (
    <div className="flex items-stretch gap-1.5 rounded-lg bg-slate-950/[0.04] p-1 ring-1 ring-slate-200 dark:bg-black/30 dark:ring-white/10">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-2 py-1.5 font-mono text-[11px] leading-5 text-slate-600 dark:text-slate-300">
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        title={copied ? 'Comando copiado' : 'Copiar comando'}
        aria-label={copied ? 'Comando copiado' : 'Copiar comando'}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-md text-slate-500 transition-colors hover:bg-slate-950/[0.06] hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white ${FOCUS_RING}`}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
};

/** Linea de estado compacta para los paneles de repositorio. */
export const StatusLine: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'danger' | 'pending';
}> = ({ icon, children, tone = 'neutral' }) => {
  const tones = {
    neutral:
      'bg-slate-500/[0.06] text-slate-600 ring-slate-200 dark:text-slate-300 dark:ring-white/10',
    success:
      'bg-emerald-500/[0.08] text-emerald-700 ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/25',
    danger:
      'bg-red-500/[0.08] text-red-700 ring-red-500/20 dark:text-red-300 dark:ring-red-400/25',
    pending:
      'bg-amber-500/[0.08] text-amber-700 ring-amber-500/20 dark:text-amber-300 dark:ring-amber-400/25',
  } as const;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ring-1 ${tones[tone]}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
};

/** Placeholder mientras se consultan datos remotos. */
export const ActionSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div
    role="status"
    aria-label={label}
    className="flex h-[42px] items-center gap-2.5 rounded-xl bg-slate-500/[0.06] px-3.5 ring-1 ring-slate-200 dark:bg-white/[0.03] dark:ring-white/10"
  >
    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
    <span className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">
      {label}
    </span>
  </div>
);
