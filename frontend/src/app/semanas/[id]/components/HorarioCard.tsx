import React from 'react';
import { ArrowDown, ArrowUp, MapPin, Radio, Video } from 'lucide-react';
import { Horario, TipoHorario } from '../../../../services';
import {
  ACCENTS,
  Accent,
  ActionLink,
  CARD_SURFACE,
  CardRail,
  Chip,
  TeacherActions,
} from './cardKit';

/**
 * Devuelve el host del enlace para mostrarlo como pista bajo el boton.
 * Saber si la clase es por Meet, Zoom o Jitsi antes de hacer click evita
 * abrir una pestana solo para descubrirlo.
 */
const describeLink = (url?: string | null) => {
  if (!url) return null;

  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const platforms: Record<string, string> = {
      'meet.google.com': 'Google Meet',
      'zoom.us': 'Zoom',
      'teams.microsoft.com': 'Microsoft Teams',
      'teams.live.com': 'Microsoft Teams',
      'meet.jit.si': 'Jitsi Meet',
      'discord.gg': 'Discord',
      'discord.com': 'Discord',
    };

    const matched = Object.keys(platforms).find(
      key => host === key || host.endsWith(`.${key}`)
    );

    return { host, platform: matched ? platforms[matched] : null };
  } catch {
    return null;
  }
};

export const HorarioCard: React.FC<{
  horario: Horario;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (horario: Horario) => void;
  onDelete: (horario: Horario) => void;
  position?: number;
  total?: number;
  ordering?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}> = ({
  horario,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  position = 0,
  total = 1,
  ordering = false,
  onMoveUp,
  onMoveDown,
}) => {
  const isVirtual = horario.tipo === TipoHorario.VIRTUAL;
  const accent: Accent = isVirtual ? 'violet' : 'emerald';
  const tokens = ACCENTS[accent];
  const link = describeLink(horario.url);

  return (
    <article
      className={`${CARD_SURFACE} ${isVirtual ? 'hover:border-violet-400/60 dark:hover:border-violet-400/40' : 'hover:border-emerald-400/60 dark:hover:border-emerald-400/40'}`}
    >
      <CardRail accent={accent} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tokens.icon}`}
            >
              {isVirtual ? (
                <Video className="h-[18px] w-[18px]" />
              ) : (
                <MapPin className="h-[18px] w-[18px]" />
              )}
            </span>
            <Chip className={tokens.chip}>
              {isVirtual ? 'Virtual' : 'Presencial'}
            </Chip>
          </div>

          <TeacherActions
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => onEdit(horario)}
            onDelete={() => onDelete(horario)}
            editLabel={`Editar horario ${horario.titulo}`}
            deleteLabel={`Eliminar horario ${horario.titulo}`}
          />
        </header>

        {canEdit && total > 1 && onMoveUp && onMoveDown && (
          <div className="flex items-center justify-between rounded-xl bg-slate-100/80 px-2 py-1.5 dark:bg-white/[0.06]">
            <span className="pl-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Posición {position + 1} de {total}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={ordering || position === 0}
                className="rounded-lg p-1.5 text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                aria-label={`Mover ${horario.titulo} antes`}
                title="Mover antes"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={ordering || position === total - 1}
                className="rounded-lg p-1.5 text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                aria-label={`Mover ${horario.titulo} después`}
                title="Mover después"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[15px] font-black leading-snug text-slate-950 dark:text-white">
            {horario.titulo}
          </h3>
          {horario.detalle && (
            <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-[13px] leading-5 text-slate-600 dark:text-slate-400">
              {horario.detalle}
            </p>
          )}
        </div>

        {horario.url && (
          <div className="mt-auto space-y-1.5 pt-1">
            <ActionLink
              href={horario.url}
              variant="solid"
              accent={accent}
              icon={
                isVirtual ? (
                  <Radio className="h-4 w-4" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )
              }
              label={isVirtual ? 'Unirse a la clase' : 'Ver enlace'}
              hint={horario.url}
            />
            {link && (
              <p className="truncate px-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {link.platform || link.host}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default HorarioCard;
