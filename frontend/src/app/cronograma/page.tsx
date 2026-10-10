import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MateriaAccessGuard } from '../../components/MateriaAccessGuard';
import { useMateriaConfig, usePermissions, useToast } from '../../hooks';
import { useConfirm } from '../../hooks/useConfirm';
import { Comision, comisionService } from '../../services/comision.service';
import { Cursada, cursadaService } from '../../services/cursada.service';
import {
  CronogramaFila,
  CronogramaFilaInput,
  cronogramaService,
} from '../../services/cronograma.service';
import { useStudentPreview } from '../../contexts/StudentPreviewContext';

const EMPTY_FORM: CronogramaFilaInput = {
  numeroSemana: 1,
  fecha: '',
  hora: null,
  actividades: '',
  temas: '',
  tareas: '',
  comisiones: [],
};

function LinkifiedText({ value }: { value: string }) {
  const parts = value.split(/(https?:\/\/[^\s]+)/g);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 underline dark:text-blue-400"
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </span>
  );
}

function CronogramaSelect({
  value,
  options,
  onChange,
  label,
  compact = false,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  label: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find(option => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`relative ${compact ? 'min-w-32' : 'min-w-64'}`}
    >
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen(current => !current)}
        onKeyDown={event => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={`flex w-full items-center justify-between gap-3 border bg-white text-left font-bold text-slate-900 shadow-sm outline-none transition-all hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-300/15 dark:bg-slate-900 dark:text-white dark:hover:border-emerald-300/70 dark:focus:border-emerald-300 ${
          compact
            ? 'min-h-9 rounded-xl px-2.5 py-1.5 text-xs'
            : 'min-h-11 rounded-xl px-3.5 py-2.5 text-sm'
        } ${open ? 'border-emerald-500 ring-4 ring-emerald-300/15 dark:border-emerald-300' : 'border-slate-300 dark:border-white/15'}`}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <span
          className={`flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300 ${compact ? 'h-6 w-6' : 'h-7 w-7'}`}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-[calc(100%+0.45rem)] z-[100] min-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/25 dark:border-white/15 dark:bg-slate-900 dark:shadow-black/60"
        >
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-bold outline-none transition-colors ${
                  isSelected
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-100'
                    : 'text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 dark:focus:bg-white/10'
                }`}
              >
                {option.label}
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RowForm({
  value,
  comisiones,
  saving,
  errors,
  onChange,
  onSave,
  onCancel,
}: {
  value: CronogramaFilaInput;
  comisiones: Comision[];
  saving: boolean;
  errors: Record<string, string>;
  onChange: (value: CronogramaFilaInput) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = <K extends keyof CronogramaFilaInput>(
    key: K,
    next: CronogramaFilaInput[K]
  ) => onChange({ ...value, [key]: next });
  const selected = new Map(
    value.comisiones.map(item => [item.comisionId, item])
  );

  const toggleCommission = (comisionId: number) => {
    const next = selected.has(comisionId)
      ? value.comisiones.filter(item => item.comisionId !== comisionId)
      : [...value.comisiones, { comisionId, modalidad: 'presencial' as const }];
    set('comisiones', next);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4 dark:border-emerald-700 dark:bg-emerald-950/20">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Semana
          <input
            type="number"
            min={1}
            value={value.numeroSemana}
            onChange={event => set('numeroSemana', Number(event.target.value))}
            className="app-form-control mt-1"
          />
          {errors.numeroSemana && (
            <span className="text-xs text-red-600">{errors.numeroSemana}</span>
          )}
        </label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Fecha
          <input
            type="date"
            value={value.fecha}
            onChange={event => set('fecha', event.target.value)}
            className="app-form-control mt-1"
          />
          {errors.fecha && (
            <span className="text-xs text-red-600">{errors.fecha}</span>
          )}
        </label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Hora (opcional)
          <input
            type="time"
            value={value.hora || ''}
            onChange={event => set('hora', event.target.value || null)}
            className="app-form-control mt-1"
          />
        </label>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {(['actividades', 'temas', 'tareas'] as const).map(key => (
          <label
            key={key}
            className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200"
          >
            {key === 'actividades'
              ? 'Actividades / Herramientas'
              : key === 'tareas'
                ? 'Tareas de los alumnos'
                : 'Temas'}
            <textarea
              rows={3}
              maxLength={4000}
              value={value[key]}
              onChange={event => set(key, event.target.value)}
              className="app-form-control mt-1 resize-y"
            />
          </label>
        ))}
      </div>
      <fieldset>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Comisiones y modalidad
          </legend>
          <button
            type="button"
            className="text-xs font-bold text-blue-700 dark:text-blue-300"
            onClick={() =>
              set(
                'comisiones',
                comisiones.map(comision => ({
                  comisionId: comision.id,
                  modalidad: 'virtual',
                }))
              )
            }
          >
            Todas como virtual
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {comisiones.map(comision => {
            const item = selected.get(comision.id);
            return (
              <div
                key={comision.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={Boolean(item)}
                  aria-label={`Seleccionar ${comision.nombre}`}
                  onClick={() => toggleCommission(comision.id)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 shadow-sm outline-none transition focus:ring-4 focus:ring-emerald-300/20 ${
                    item
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950 dark:border-emerald-300 dark:bg-emerald-300'
                      : 'border-slate-400 bg-white text-transparent hover:border-emerald-500 dark:border-slate-500 dark:bg-slate-800 dark:hover:border-emerald-300'
                  }`}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {comision.nombre}
                </span>
                {item && (
                  <CronogramaSelect
                    value={item.modalidad}
                    label={`Modalidad de ${comision.nombre}`}
                    compact
                    options={[
                      { value: 'presencial', label: 'Presencial' },
                      { value: 'virtual', label: 'Virtual' },
                    ]}
                    onChange={modalidad =>
                      set(
                        'comisiones',
                        value.comisiones.map(current =>
                          current.comisionId === comision.id
                            ? {
                                ...current,
                                modalidad: modalidad as
                                  | 'presencial'
                                  | 'virtual',
                              }
                            : current
                        )
                      )
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
        {errors.comisiones && (
          <p className="mt-1 text-xs text-red-600">{errors.comisiones}</p>
        )}
      </fieldset>
      {errors.general && (
        <p className="rounded-lg bg-red-100 p-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {errors.general}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-600"
        >
          <X className="h-4 w-4" /> Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

export default function CronogramaPage() {
  const { id } = useParams<{ id: string }>();
  const materiaId = Number(id);
  const { canManageCurrentMateria, loadingPermissions } = usePermissions();
  const { selection, isPreviewing } = useStudentPreview();
  const { config } = useMateriaConfig(materiaId);
  const toast = useToast();
  const { confirmState, confirm } = useConfirm();
  const [cursada, setCursada] = useState<Cursada | null>(null);
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [filas, setFilas] = useState<CronogramaFila[]>([]);
  const [filter, setFilter] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<CronogramaFilaInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadRows = useCallback(async (active: Cursada, selected?: number) => {
    setError('');
    try {
      setFilas(await cronogramaService.list(active.id, selected));
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          'No se pudo cargar el cronograma.'
      );
    }
  }, []);

  useEffect(() => {
    if (loadingPermissions) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const cursadas = await cursadaService.getByMateria(materiaId);
        const active = cursadas.find(item => item.activa) || null;
        if (cancelled) return;
        setCursada(active);
        if (!active) {
          setFilas([]);
          setComisiones([]);
          return;
        }
        const previewCommissionId =
          isPreviewing && selection?.cursadaId === active.id
            ? selection.comisionId
            : undefined;
        const commissionsPromise = canManageCurrentMateria
          ? comisionService.getByCursada(active.id)
          : Promise.resolve([]);
        const [rows, commissions] = await Promise.all([
          cronogramaService.list(active.id, previewCommissionId),
          commissionsPromise,
        ]);
        if (!cancelled) {
          setFilas(rows);
          setComisiones(commissions);
        }
      } catch (requestError: any) {
        if (!cancelled)
          setError(
            requestError.response?.data?.message ||
              'No se pudo cargar el cronograma.'
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    materiaId,
    canManageCurrentMateria,
    loadingPermissions,
    isPreviewing,
    selection,
  ]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!Number.isInteger(form.numeroSemana) || form.numeroSemana < 1)
      next.numeroSemana = 'Debe ser mayor que cero.';
    if (!form.fecha) next.fecha = 'La fecha es obligatoria.';
    if (form.comisiones.length === 0)
      next.comisiones = 'Seleccioná al menos una comisión.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!cursada || !validate()) return;
    setSaving(true);
    setErrors({});
    try {
      if (editingId === 'new') await cronogramaService.create(cursada.id, form);
      else if (typeof editingId === 'number')
        await cronogramaService.update(editingId, form);
      toast.success(
        editingId === 'new'
          ? 'Fila agregada correctamente'
          : 'Fila actualizada correctamente'
      );
      setEditingId(null);
      await loadRows(cursada, filter);
    } catch (requestError: any) {
      const message = requestError.response?.data?.message;
      setErrors({
        general: Array.isArray(message)
          ? message.join(' ')
          : message || 'No se pudo guardar la fila.',
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (fila: CronogramaFila) => {
    const displayDate = fila.fecha
      ? new Date(`${fila.fecha}T12:00:00`).toLocaleDateString('es-AR')
      : 'sin fecha';
    const confirmed = await confirm({
      title: '¿Eliminar esta fila del cronograma?',
      message: `Vas a eliminar la fila de la semana ${fila.numeroSemana}, correspondiente al ${displayDate}. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar fila',
      cancelText: 'Conservar fila',
      variant: 'danger',
    });
    if (!confirmed) return;
    setDeletingId(fila.id);
    try {
      await cronogramaService.remove(fila.id);
      toast.success('Fila eliminada correctamente');
      if (cursada) await loadRows(cursada, filter);
    } catch (requestError: any) {
      toast.error(
        requestError.response?.data?.message || 'No se pudo eliminar la fila.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const duplicate = async (fila: CronogramaFila) => {
    if (!cursada || duplicatingId !== null) return;
    setDuplicatingId(fila.id);
    try {
      await cronogramaService.create(cursada.id, {
        numeroSemana: fila.numeroSemana,
        fecha: fila.fecha,
        hora: fila.hora?.slice(0, 5) || null,
        actividades: fila.actividades,
        temas: fila.temas,
        tareas: fila.tareas,
        comisiones: fila.comisiones.map(item => ({
          comisionId: item.comisionId,
          modalidad: item.modalidad,
        })),
      });
      toast.success('Fila duplicada correctamente');
      await loadRows(cursada, filter);
    } catch (requestError: any) {
      toast.error(
        requestError.response?.data?.message || 'No se pudo duplicar la fila.'
      );
    } finally {
      setDuplicatingId(null);
    }
  };

  if (loading || loadingPermissions)
    return <LoadingSpinner fullScreen size="lg" label="Cargando cronograma…" />;

  return (
    <MateriaAccessGuard
      materiaId={materiaId}
      materiaNombre="Materia"
      cursadaId={cursada?.id || 0}
    >
      <div className="materia-page-shell">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        <main className="relative z-10 mx-auto w-full max-w-[1800px] space-y-5 px-4 py-8 sm:px-6 lg:px-8">
          <header className="app-surface flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                <CalendarDays className="h-5 w-5" /> Cronograma académico
              </p>
              <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
                {config.pages.cronograma?.titulo || 'Cronograma'}
              </h1>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                {config.pages.cronograma?.descripcion ||
                  'Clases y actividades de la cursada.'}
              </p>
              {cursada && (
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-bold dark:bg-slate-800">
                    {cursada.titulo}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Activa
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                    {filas.length} filas
                  </span>
                </div>
              )}
            </div>
            {cursada && canManageCurrentMateria && (
              <div className="flex flex-wrap gap-2">
                <CronogramaSelect
                  value={filter ? String(filter) : ''}
                  label="Filtrar por comisión"
                  options={[
                    { value: '', label: 'Todas las comisiones' },
                    ...comisiones.map(item => ({
                      value: String(item.id),
                      label: item.nombre,
                    })),
                  ]}
                  onChange={async value => {
                    const selected = value ? Number(value) : undefined;
                    setFilter(selected);
                    await loadRows(cursada, selected);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...EMPTY_FORM });
                    setErrors({});
                    setEditingId('new');
                  }}
                  disabled={editingId !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-black text-slate-950 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Agregar fila
                </button>
              </div>
            )}
          </header>

          {!cursada ? (
            <section className="app-surface p-10 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-slate-400" />
              <h2 className="mt-3 text-xl font-black">
                No existe una cursada activa
              </h2>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Activá una cursada para cargar y administrar su cronograma.
              </p>
            </section>
          ) : error ? (
            <section className="app-surface border-red-200 p-6 text-red-700 dark:text-red-300">
              {error}
            </section>
          ) : (
            <section className="app-surface space-y-4 p-3 sm:p-5">
              {!canManageCurrentMateria && (
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Comisión visualizada:{' '}
                  {isPreviewing && selection
                    ? selection.comisionNombre
                    : 'tu comisión asignada'}
                </p>
              )}
              {editingId === 'new' && (
                <RowForm
                  value={form}
                  comisiones={comisiones}
                  saving={saving}
                  errors={errors}
                  onChange={setForm}
                  onSave={save}
                  onCancel={() => setEditingId(null)}
                />
              )}
              {filas.length === 0 && editingId !== 'new' ? (
                <div className="py-12 text-center text-slate-600 dark:text-slate-300">
                  No hay filas cargadas para esta comisión.
                </div>
              ) : (
                <>
                  {/* Debajo de lg, una fila de tabla con 7-8 columnas obliga a
                      scrollear lateralmente para leer un solo dato. Se
                      muestra en tarjetas apiladas y la tabla completa queda
                      para pantallas que le entran sin recortar contenido. */}
                  <div className="grid gap-3 lg:hidden">
                    {filas.map((fila, index) =>
                      editingId === fila.id ? (
                        <RowForm
                          key={fila.id}
                          value={form}
                          comisiones={comisiones}
                          saving={saving}
                          errors={errors}
                          onChange={setForm}
                          onSave={save}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <article
                          key={fila.id}
                          className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 ${index === 0 || filas[index - 1].numeroSemana !== fila.numeroSemana ? 'border-t-4 border-t-emerald-300 dark:border-t-emerald-700' : ''}`}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Semana {fila.numeroSemana ?? '—'}
                              </p>
                              <p className="font-black text-slate-950 dark:text-white">
                                {fila.fecha
                                  ? new Date(
                                      `${fila.fecha}T12:00:00`
                                    ).toLocaleDateString('es-AR')
                                  : '—'}
                                {fila.hora?.slice(0, 5) && (
                                  <span className="ml-2 font-medium text-slate-500 dark:text-slate-400">
                                    {fila.hora.slice(0, 5)}
                                  </span>
                                )}
                              </p>
                            </div>
                            {canManageCurrentMateria && (
                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  aria-label={`Duplicar semana ${fila.numeroSemana}`}
                                  title="Duplicar fila"
                                  onClick={() => duplicate(fila)}
                                  disabled={
                                    duplicatingId !== null ||
                                    deletingId !== null ||
                                    editingId !== null
                                  }
                                  className="rounded-lg border border-violet-200 bg-violet-50 p-2 text-violet-700 hover:bg-violet-100 disabled:opacity-40 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300 dark:hover:bg-violet-900"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Editar semana ${fila.numeroSemana}`}
                                  onClick={() => {
                                    setForm({
                                      numeroSemana: fila.numeroSemana,
                                      fecha: fila.fecha,
                                      hora: fila.hora?.slice(0, 5) || null,
                                      actividades: fila.actividades,
                                      temas: fila.temas,
                                      tareas: fila.tareas,
                                      comisiones: fila.comisiones.map(item => ({
                                        comisionId: item.comisionId,
                                        modalidad: item.modalidad,
                                      })),
                                    });
                                    setErrors({});
                                    setEditingId(fila.id);
                                  }}
                                  disabled={editingId !== null}
                                  className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100 disabled:opacity-40 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Eliminar semana ${fila.numeroSemana}`}
                                  onClick={() => remove(fila)}
                                  disabled={
                                    deletingId !== null || editingId !== null
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-40 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {fila.comisiones.map(item => (
                              <span
                                key={item.comisionId}
                                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:bg-white/10 dark:text-slate-100"
                              >
                                {item.comision?.nombre?.trim() || 'Tu comisión'}
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${item.modalidad === 'virtual' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}
                                >
                                  {item.modalidad === 'virtual'
                                    ? 'Virtual'
                                    : 'Presencial'}
                                </span>
                              </span>
                            ))}
                          </div>

                          <dl className="space-y-2 text-sm">
                            {[
                              ['Actividades / Herramientas', fila.actividades],
                              ['Temas', fila.temas],
                              ['Tareas de los alumnos', fila.tareas],
                            ]
                              .filter(([, value]) => value)
                              .map(([label, value]) => (
                                <div key={label}>
                                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {label}
                                  </dt>
                                  <dd className="mt-0.5 text-slate-800 dark:text-slate-200">
                                    <LinkifiedText value={value} />
                                  </dd>
                                </div>
                              ))}
                          </dl>
                        </article>
                      )
                    )}
                  </div>

                  <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 lg:block">
                    <table className="min-w-[1250px] w-full border-collapse bg-white text-left text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                      <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <tr>
                          {[
                            'Semana',
                            'Fecha',
                            'Hora',
                            'Comisión y modalidad',
                            'Actividades / Herramientas',
                            'Temas',
                            'Tareas de los alumnos',
                            ...(canManageCurrentMateria ? ['Acciones'] : []),
                          ].map(label => (
                            <th key={label} className="px-3 py-3">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                        {filas.map((fila, index) => (
                          <React.Fragment key={fila.id}>
                            {editingId === fila.id ? (
                              <tr>
                                <td
                                  colSpan={canManageCurrentMateria ? 8 : 7}
                                  className="p-3"
                                >
                                  <RowForm
                                    value={form}
                                    comisiones={comisiones}
                                    saving={saving}
                                    errors={errors}
                                    onChange={setForm}
                                    onSave={save}
                                    onCancel={() => setEditingId(null)}
                                  />
                                </td>
                              </tr>
                            ) : (
                              <tr
                                className={`border-t border-slate-200 align-top dark:border-slate-700 ${index === 0 || filas[index - 1].numeroSemana !== fila.numeroSemana ? 'border-t-4 border-t-emerald-300 dark:border-t-emerald-700' : ''}`}
                              >
                                <td className="px-3 py-4 font-black text-slate-950 dark:text-white">
                                  {fila.numeroSemana ?? '—'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 font-medium text-slate-900 dark:text-slate-100">
                                  {fila.fecha
                                    ? new Date(
                                        `${fila.fecha}T12:00:00`
                                      ).toLocaleDateString('es-AR')
                                    : '—'}
                                </td>
                                <td className="px-3 py-4 font-medium text-slate-900 dark:text-slate-100">
                                  {fila.hora?.slice(0, 5) || '—'}
                                </td>
                                <td className="px-3 py-4 text-slate-900 dark:text-slate-100">
                                  <div className="space-y-1">
                                    {fila.comisiones.map(item => (
                                      <div
                                        key={item.comisionId}
                                        className="flex flex-wrap items-center gap-1.5"
                                      >
                                        <span className="font-semibold text-slate-950 dark:text-white">
                                          {item.comision?.nombre?.trim() ||
                                            'Tu comisión'}
                                        </span>{' '}
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.modalidad === 'virtual' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}
                                        >
                                          {item.modalidad === 'virtual'
                                            ? 'Virtual'
                                            : 'Presencial'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="max-w-xs px-3 py-4 text-slate-900 dark:text-slate-100">
                                  <LinkifiedText value={fila.actividades} />
                                </td>
                                <td className="max-w-xs px-3 py-4 text-slate-900 dark:text-slate-100">
                                  <LinkifiedText value={fila.temas} />
                                </td>
                                <td className="max-w-xs px-3 py-4 text-slate-900 dark:text-slate-100">
                                  <LinkifiedText value={fila.tareas} />
                                </td>
                                {canManageCurrentMateria && (
                                  <td className="px-3 py-4 text-slate-900 dark:text-slate-100">
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        aria-label={`Duplicar semana ${fila.numeroSemana}`}
                                        title="Duplicar fila"
                                        onClick={() => duplicate(fila)}
                                        disabled={
                                          duplicatingId !== null ||
                                          deletingId !== null ||
                                          editingId !== null
                                        }
                                        className="rounded-lg border border-violet-200 bg-violet-50 p-2 text-violet-700 hover:bg-violet-100 disabled:opacity-40 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300 dark:hover:bg-violet-900"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        aria-label={`Editar semana ${fila.numeroSemana}`}
                                        onClick={() => {
                                          setForm({
                                            numeroSemana: fila.numeroSemana,
                                            fecha: fila.fecha,
                                            hora:
                                              fila.hora?.slice(0, 5) || null,
                                            actividades: fila.actividades,
                                            temas: fila.temas,
                                            tareas: fila.tareas,
                                            comisiones: fila.comisiones.map(
                                              item => ({
                                                comisionId: item.comisionId,
                                                modalidad: item.modalidad,
                                              })
                                            ),
                                          });
                                          setErrors({});
                                          setEditingId(fila.id);
                                        }}
                                        disabled={editingId !== null}
                                        className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100 disabled:opacity-40 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        aria-label={`Eliminar semana ${fila.numeroSemana}`}
                                        onClick={() => remove(fila)}
                                        disabled={
                                          deletingId !== null ||
                                          editingId !== null
                                        }
                                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-40 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      </div>
      <ConfirmDialog {...confirmState} />
    </MateriaAccessGuard>
  );
}
