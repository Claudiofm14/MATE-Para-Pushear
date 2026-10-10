import React from 'react';
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Eye,
  FileText,
  GitFork,
  Link2,
  Table2,
  Users,
} from 'lucide-react';
import { Ejercicio } from '../../../../services';
import {
  ACCENTS,
  Accent,
  ActionLink,
  CARD_SURFACE,
  CardRail,
  Chip,
  TeacherActions,
} from './cardKit';
import {
  GroupExercisePanel,
  StudentRepoPanel,
  TeacherRepoPanel,
} from './ExercisePanels';

const RESOURCE_TYPE_LABEL: Record<string, string> = {
  planilla: 'Planilla',
  documento: 'Documento',
  presentacion: 'Presentacion',
  pdf: 'PDF',
  video: 'Video',
  otro: 'Recurso',
};

const parseDateOnly = (date: string) => {
  const [year, month, day] = date.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** El año solo agrega ruido cuando la entrega cae en el ciclo en curso. */
const formatShortDate = (date: Date) =>
  date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === new Date().getFullYear()
      ? {}
      : { year: 'numeric' }),
  });

/**
 * Traduce la fecha de entrega a lenguaje relativo.
 *
 * Una fecha suelta obliga al alumno a hacer la cuenta mental; "Vence en
 * 2 dias" se entiende de un vistazo y el color refuerza la urgencia.
 *
 * La distancia se mide entre dias de calendario y no entre instantes: con
 * la resta de milisegundos, un vencimiento de hoy a las 23:59 daba medio
 * dia de diferencia y se anunciaba como "Vence mañana" durante toda la
 * jornada en la que en realidad vencia.
 */
const describeDeadline = (raw?: string) => {
  if (!raw) return null;

  const deadline = parseDateOnly(raw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Math.round absorbe la hora que aportan los cambios de horario de verano.
  const diffDays = Math.round(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const formatted = formatShortDate(deadline);

  if (diffDays < 0) {
    return {
      label: `Vencio el ${formatted}`,
      className:
        'bg-red-500/12 text-red-700 ring-1 ring-red-500/25 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25',
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Vence hoy',
      className:
        'bg-red-600 text-white ring-1 ring-red-600 shadow-sm shadow-red-950/25',
    };
  }

  if (diffDays <= 3) {
    return {
      label: diffDays === 1 ? 'Vence mañana' : `Vence en ${diffDays} días`,
      className:
        'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25',
    };
  }

  return {
    label: `Entrega ${formatted}`,
    className:
      'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/15 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10',
  };
};

export const ExerciseCard: React.FC<{
  ejercicio: Ejercicio;
  canEdit: boolean;
  canDelete: boolean;
  isStudentPreview?: boolean;
  onEdit: (ejercicio: Ejercicio) => void;
  onDelete: (ejercicio: Ejercicio) => void;
}> = ({
  ejercicio,
  canEdit,
  canDelete,
  isStudentPreview = false,
  onEdit,
  onDelete,
}) => {
  const activityType = ejercicio.tipoActividad || 'programacion';
  const hasExample = !!ejercicio.repositorioEjemplo;
  const hasReadme = !!ejercicio.readmeUrl;
  const hasClassroom = !!ejercicio.classroomUrl;
  const hasExternalResource = !!ejercicio.recursoUrl;
  const hasGiteaTemplate =
    activityType === 'programacion' && !!ejercicio.giteaAutoCreateRepo;
  const isGroupWork = ejercicio.assignmentMode === 'group';
  const deadline = describeDeadline(ejercicio.fechaEntrega);

  const hasAnyResource =
    hasExternalResource ||
    hasExample ||
    hasReadme ||
    hasClassroom ||
    hasGiteaTemplate;

  const primaryResource =
    activityType === 'archivo'
      ? RESOURCE_TYPE_LABEL[ejercicio.recursoTipo || 'otro']
      : activityType === 'enlace'
        ? 'Enlace externo'
        : activityType === 'instrucciones'
          ? 'Instrucciones'
          : hasGiteaTemplate
            ? 'Plantilla Gitea'
            : hasClassroom
              ? 'Asignacion externa'
              : hasReadme
                ? 'Instrucciones'
                : hasExample
                  ? 'Ejemplo resuelto'
                  : 'Sin enlaces';

  const accent: Accent =
    activityType === 'archivo'
      ? 'amber'
      : activityType === 'enlace'
        ? 'sky'
        : activityType === 'instrucciones'
          ? 'violet'
          : hasGiteaTemplate
            ? 'emerald'
            : 'blue';
  const tokens = ACCENTS[accent];

  const primaryIcon =
    activityType === 'archivo' ? (
      <Table2 className="h-[18px] w-[18px]" />
    ) : activityType === 'enlace' ? (
      <Link2 className="h-[18px] w-[18px]" />
    ) : hasGiteaTemplate ? (
      <GitFork className="h-[18px] w-[18px]" />
    ) : hasReadme || activityType === 'instrucciones' ? (
      <FileText className="h-[18px] w-[18px]" />
    ) : (
      <BookOpen className="h-[18px] w-[18px]" />
    );

  const getTemplateRepoUrl = () => {
    if (ejercicio.giteaTemplateCloneUrl) {
      return ejercicio.giteaTemplateCloneUrl.replace(/\.git$/, '');
    }

    if (ejercicio.giteaTemplateOwner && ejercicio.giteaTemplateRepo) {
      return `http://gitea-unahur.duckdns.org/${ejercicio.giteaTemplateOwner}/${ejercicio.giteaTemplateRepo}`;
    }

    return undefined;
  };

  /**
   * Solo la primera accion disponible se dibuja solida. Con varios botones
   * del mismo peso el alumno no sabe cual es "el" boton del ejercicio; los
   * paneles de repositorio ya traen su propia accion primaria, asi que
   * cuando estan presentes el resto queda en suave.
   *
   * La accion principal usa siempre el verde de la aplicacion, sin importar
   * el tipo de actividad: el color del tipo vive en el icono y en el chip,
   * y asi el boton verde significa lo mismo en toda la pantalla ("esto es
   * lo que tenes que hacer") en vez de pintar una fila de colores sueltos.
   */
  let primaryClaimed = hasGiteaTemplate;
  const nextAction = (
    secondaryAccent: Accent
  ): { variant: 'solid' | 'soft'; accent: Accent } => {
    if (primaryClaimed) return { variant: 'soft', accent: secondaryAccent };
    primaryClaimed = true;
    return { variant: 'solid', accent: 'emerald' };
  };

  return (
    <article
      className={`${CARD_SURFACE} hover:border-slate-300 dark:hover:border-white/20`}
    >
      <CardRail accent={accent} />

      {/* Encabezado */}
      <header className="flex items-start gap-3 border-b border-slate-100 p-4 dark:border-white/[0.06]">
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tokens.icon}`}
        >
          {primaryIcon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Chip className={tokens.chip}>{primaryResource}</Chip>
            {isGroupWork && (
              <Chip
                className="bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25"
                icon={<Users className="h-3 w-3" />}
              >
                Grupal
              </Chip>
            )}
            {deadline && (
              <Chip
                className={deadline.className}
                icon={<CalendarClock className="h-3 w-3" />}
              >
                {deadline.label}
              </Chip>
            )}
          </div>

          <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-950 dark:text-white">
            {ejercicio.titulo}
          </h3>
        </div>
      </header>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {ejercicio.descripcion && (
          <p className="line-clamp-3 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
            {ejercicio.descripcion}
          </p>
        )}

        <div className="space-y-1.5">
          {hasGiteaTemplate && canEdit && (
            <ActionLink
              href={getTemplateRepoUrl()}
              variant="soft"
              accent="emerald"
              icon={<GitFork className="h-4 w-4" />}
              label="Abrir plantilla"
              hint="Repositorio plantilla del ejercicio"
            />
          )}

          {hasGiteaTemplate && canEdit && (
            <TeacherRepoPanel ejercicio={ejercicio} />
          )}

          {hasGiteaTemplate && !canEdit && isStudentPreview && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
              El alumno puede preparar su repositorio desde aquí
            </div>
          )}

          {hasGiteaTemplate &&
            !canEdit &&
            !isStudentPreview &&
            (isGroupWork ? (
              <GroupExercisePanel ejercicio={ejercicio} canEdit={false} />
            ) : (
              <StudentRepoPanel ejercicio={ejercicio} />
            ))}

          {hasGiteaTemplate && canEdit && isGroupWork && (
            <GroupExercisePanel ejercicio={ejercicio} canEdit />
          )}

          {hasExternalResource && (
            <ActionLink
              href={ejercicio.recursoUrl}
              {...nextAction(accent)}
              icon={
                activityType === 'archivo' ? (
                  <Table2 className="h-4 w-4" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )
              }
              label={
                ejercicio.recursoTitulo ||
                (activityType === 'archivo'
                  ? `Abrir ${RESOURCE_TYPE_LABEL[ejercicio.recursoTipo || 'otro']}`
                  : 'Abrir enlace')
              }
            />
          )}

          {hasClassroom && (
            <ActionLink
              href={ejercicio.classroomUrl}
              {...nextAction('emerald')}
              icon={<ClipboardCheck className="h-4 w-4" />}
              label={canEdit ? 'Abrir asignacion' : 'Aceptar asignacion'}
            />
          )}

          {hasReadme && (
            <ActionLink
              href={ejercicio.readmeUrl}
              {...nextAction('sky')}
              icon={<FileText className="h-4 w-4" />}
              label="Instrucciones"
            />
          )}

          {hasExample && (
            <ActionLink
              href={ejercicio.repositorioEjemplo}
              variant="soft"
              accent="violet"
              icon={<Eye className="h-4 w-4" />}
              label="Ver ejemplo"
            />
          )}

          {!hasAnyResource && (
            <div className="rounded-xl bg-slate-500/[0.05] px-3.5 py-3 text-[13px] font-semibold leading-5 text-slate-500 ring-1 ring-slate-200 dark:bg-white/[0.03] dark:text-slate-400 dark:ring-white/10">
              {activityType === 'instrucciones'
                ? 'La consigna está en la descripción.'
                : 'Esta actividad no tiene enlaces cargados.'}
            </div>
          )}
        </div>

        {/* Pie */}
        <footer className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          {canEdit || canDelete ? (
            <>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Acciones docente
              </span>
              <TeacherActions
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={() => onEdit(ejercicio)}
                onDelete={() => onDelete(ejercicio)}
                editLabel={`Editar ejercicio ${ejercicio.titulo}`}
                deleteLabel={`Eliminar ejercicio ${ejercicio.titulo}`}
              />
            </>
          ) : (
            <span className="text-[11px] font-semibold leading-4 text-slate-500 dark:text-slate-400">
              {hasGiteaTemplate
                ? 'Repositorio preparado para tu entrega.'
                : 'Revisá los recursos disponibles para resolver el ejercicio.'}
            </span>
          )}
        </footer>
      </div>
    </article>
  );
};

export default ExerciseCard;
