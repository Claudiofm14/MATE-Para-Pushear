import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  Layers3,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '../../shared/design-system/components/Button';
import { Card } from '../../shared/design-system/components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorComponent } from '../../components/ErrorComponent';
import { BlockEditor } from '../../components/BlockEditor';
import { BlockRenderer } from '../../components/BlockRenderer';
import { useContratoPedagogico } from '../../modules/contrato-pedagogico/hooks/useContratoPedagogico';
import { ContenedorTipo } from '../../modules/contrato-pedagogico/types/contrato-pedagogico.types';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../hooks/useToast';
import { ContentBlock, MaterialContent } from '../../types/content-blocks';

const BLOCK_SECTION_TYPE: ContenedorTipo = 'bienvenida';

type ContractSection = {
  id: number;
  titulo: string;
  subtitulo?: string;
  tipo?: ContenedorTipo;
  hijos?: ContractSection[];
};

const getSectionEntity = (section: any): ContractSection =>
  section?.contenedor || section;

const getSections = (data: any): ContractSection[] => {
  const rawSections = data?.secciones || data?.contenedores || [];
  return rawSections.map(getSectionEntity).filter(Boolean);
};

const parseBlocks = (subtitulo?: string): MaterialContent | null => {
  if (!subtitulo) return null;

  try {
    const parsed = JSON.parse(subtitulo);
    if (Array.isArray(parsed?.blocks)) {
      return parsed as MaterialContent;
    }
  } catch {
    return null;
  }

  return null;
};

const legacySectionToContent = (section: ContractSection): MaterialContent => ({
  blocks: [
    {
      id: `legacy-${section.id}`,
      type: 'text',
      data: {
        titulo: '',
        contenido: section.subtitulo || '',
        fontFamily: 'sans',
        fontSize: 'base',
        titleFontSize: 'lg',
        titleAlign: 'left',
        titleColorPreset: 'neutral',
        colorPreset: 'slate',
        bold: false,
        italic: false,
        underline: false,
        align: 'left',
      },
    },
  ],
});

interface ContractSectionModalProps {
  isOpen: boolean;
  creating: boolean;
  materiaId: number;
  initialTitle?: string;
  initialBlocks?: ContentBlock[];
  submitLabel?: string;
  titleLabel?: string;
  onClose: () => void;
  onSave: (title: string, blocks: ContentBlock[]) => Promise<void>;
}

const ContractSectionModal: React.FC<ContractSectionModalProps> = ({
  isOpen,
  creating,
  materiaId,
  initialTitle = '',
  initialBlocks = [],
  submitLabel = 'Crear seccion',
  titleLabel = 'Nueva seccion con bloques',
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setBlocks(initialBlocks);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setError('El titulo de la seccion es obligatorio');
      return;
    }

    if (blocks.length === 0) {
      setError('Agrega al menos un bloque de contenido');
      return;
    }

    setError(null);
    await onSave(title.trim(), blocks);
  };

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        onClick={creating ? undefined : onClose}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-5xl">
          <div className="flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-950 sm:max-h-[90vh]">
            <div className="relative flex-shrink-0 overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.24),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#e0f2fe_52%,#d1fae5_100%)] p-5 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.22),transparent_34%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#0f766e_100%)] sm:p-7">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] [background-size:28px_28px] dark:[background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-950/25">
                    <Layers3 className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:border-white/15 dark:bg-white/10 dark:text-emerald-100">
                      Contrato pedagogico
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                      {titleLabel}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-200 sm:text-base">
                      Arma la seccion con texto, listas, enlaces, comandos,
                      imagenes, archivos o referencias a material academico.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={creating}
                  className="relative rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-600 transition-all hover:bg-white hover:text-slate-950 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white"
                  aria-label="Cerrar"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%),#f8fafc] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_30%),#0f172a]"
            >
              <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-300/30 dark:bg-red-500/10 dark:text-red-100">
                    {error}
                  </div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
                  <label
                    htmlFor="section-title"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Titulo de la seccion <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="section-title"
                    type="text"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-white/10 dark:bg-slate-950/45 dark:text-white dark:placeholder:text-slate-500"
                    placeholder="Ej: Criterios de aprobacion"
                  />
                </div>

                <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white/80 shadow-2xl shadow-black/15 dark:border-emerald-300/25 dark:bg-white/[0.04]">
                  <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
                    <h3 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
                      <Layers3 className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
                      Bloques de la seccion
                    </h3>
                  </div>
                  <div className="p-4 sm:p-5">
                    <BlockEditor
                      blocks={blocks}
                      onChange={setBlocks}
                      materiaId={materiaId}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-slate-900/95 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={creating}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 shadow-lg shadow-emerald-950/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-300 disabled:translate-y-0 disabled:opacity-50 sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  {creating ? 'Guardando...' : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export function ContratoPedagogicoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const materiaId = Number(id);
  const { isDocente, isAdmin } = usePermissions();

  const {
    data,
    loading,
    error,
    refetch,
    crearContrato,
    actualizarContrato,
    agregarSeccion,
    eliminarSeccion,
  } = useContratoPedagogico(materiaId);

  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ContractSection | null>(
    null
  );
  const [creatingSection, setCreatingSection] = useState(false);

  const canEdit = isDocente || isAdmin;
  const sections = useMemo(() => getSections(data), [data]);
  const editingSectionContent = editingSection
    ? parseBlocks(editingSection.subtitulo) ||
      legacySectionToContent(editingSection)
    : null;

  const sectionToPayload = (section: ContractSection) => ({
    titulo: section.titulo,
    subtitulo:
      parseBlocks(section.subtitulo) || !section.subtitulo
        ? section.subtitulo || ''
        : JSON.stringify(legacySectionToContent(section)),
    tipo: section.tipo || BLOCK_SECTION_TYPE,
  });

  const handleCreateSeccion = async (
    sectionTitle: string,
    blocks: ContentBlock[]
  ) => {
    setCreatingSection(true);
    try {
      const sectionPayload = {
        titulo: sectionTitle,
        subtitulo: JSON.stringify({ blocks } as MaterialContent),
        tipo: BLOCK_SECTION_TYPE,
      };

      if (error === '404' || !data) {
        await crearContrato({
          titulo: 'Contrato Pedagogico',
          materiaId,
          secciones: [sectionPayload],
        });
      } else {
        await agregarSeccion(sectionPayload);
      }

      setShowCreateModal(false);
      toast.success('Seccion creada exitosamente');
    } catch (err) {
      console.error('Error al crear seccion:', err);
      toast.error('Error al crear la seccion. Intenta de nuevo.');
    } finally {
      setCreatingSection(false);
    }
  };

  const handleUpdateSeccion = async (
    sectionTitle: string,
    blocks: ContentBlock[]
  ) => {
    if (!editingSection || !data) return;

    setCreatingSection(true);
    try {
      await actualizarContrato({
        titulo: data.titulo || 'Contrato Pedagogico',
        secciones: sections.map(section =>
          section.id === editingSection.id
            ? {
                titulo: sectionTitle,
                subtitulo: JSON.stringify({ blocks } as MaterialContent),
                tipo: section.tipo || BLOCK_SECTION_TYPE,
              }
            : sectionToPayload(section)
        ),
      });

      setEditingSection(null);
      toast.success('Seccion actualizada');
    } catch (err) {
      console.error('Error al actualizar seccion:', err);
      toast.error('No se pudo actualizar la seccion');
    } finally {
      setCreatingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!window.confirm('Eliminar esta seccion del contrato pedagogico?')) {
      return;
    }

    try {
      await eliminarSeccion(sectionId);
      toast.success('Seccion eliminada');
    } catch (err) {
      console.error('Error al eliminar seccion:', err);
      toast.error('No se pudo eliminar la seccion');
    }
  };

  if (loading) {
    return (
      <div className="materia-page-shell flex items-center justify-center">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        <LoadingSpinner />
      </div>
    );
  }

  if (error === '404') {
    return (
      <div className="materia-page-shell">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />

        <section className="materia-hero">
          <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="materia-chip-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                <FileText className="h-3.5 w-3.5" />
                Contrato pedagogico
              </span>
            </div>
            <h1 className="materia-hero-title max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
              Contrato Pedagogico
            </h1>
            <p className="materia-hero-description mt-4 max-w-3xl text-lg font-medium leading-8">
              Terminos, condiciones y acuerdos de cursada.
            </p>
          </div>
        </section>

        <main className="container relative z-10 mx-auto px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/[0.96] p-8 text-center shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900/90 sm:p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-950/20">
              <FileText className="h-9 w-9" />
            </div>

            <h2 className="mb-3 text-2xl font-black text-slate-950 dark:text-white">
              Todavia no hay contrato pedagogico
            </h2>

            {canEdit ? (
              <div className="space-y-6">
                <p className="text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
                  Crea la primera seccion para empezar a armar el contenido con
                  bloques editables.
                </p>
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Crear primera seccion
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
                  El contrato pedagogico aun no esta disponible.
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate(`/materia/${id}`)}
                >
                  Volver a la materia
                </Button>
              </div>
            )}
          </div>
        </main>

        <ContractSectionModal
          isOpen={showCreateModal}
          creating={creatingSection}
          materiaId={materiaId}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSeccion}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="materia-page-shell">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        <div className="container relative z-10 mx-auto px-4 py-8">
          <ErrorComponent error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="materia-page-shell">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        <div className="container relative z-10 mx-auto px-4 py-8">
          <Card className="py-12 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              No hay datos disponibles
            </p>
            <Button onClick={refetch} className="mt-6">
              Reintentar
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="materia-page-shell">
      <div className="materia-page-gradient" />
      <div className="materia-page-grid" />

      {canEdit && (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-5 sm:left-auto sm:right-5">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300/60 bg-white/95 p-3 text-slate-950 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:border-amber-300/30 dark:bg-slate-950/90 dark:text-white dark:shadow-slate-950/35 sm:justify-start">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-300 text-slate-950">
              <Pencil className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h3 className="text-sm font-black text-slate-950 dark:text-white">
                Modo Edicion
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Personaliza el contrato
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-xl border-none bg-amber-300 px-5 text-slate-950 shadow-sm hover:bg-amber-200 hover:shadow-md"
            >
              {isEditing ? 'Finalizar' : 'Editar'}
            </Button>
            {isEditing && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="rounded-xl px-5"
              >
                <Plus className="mr-2 h-4 w-4" />
                Seccion
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 space-y-8 pb-16">
        <section className="materia-hero">
          <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="materia-chip-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Contrato pedagogico
              </span>
              {canEdit && (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
                  Gestion docente
                </span>
              )}
            </div>
            <h1 className="materia-hero-title max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
              {data.titulo || 'Contrato Pedagogico'}
            </h1>
            <p className="materia-hero-description mt-4 max-w-3xl text-lg font-medium leading-8">
              Terminos, condiciones y acuerdos de cursada.
            </p>
          </div>
        </section>

        <main className="container mx-auto space-y-8 px-4">
          {sections.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white/[0.96] p-8 text-center shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900/90 sm:p-10">
              <FileText className="mx-auto mb-4 h-12 w-12 text-emerald-500 dark:text-emerald-300" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                Todavia no hay secciones cargadas.
              </p>
              {canEdit && (
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6"
                >
                  Crear primera seccion
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map(section => {
                const blockContent =
                  parseBlocks(section.subtitulo) ||
                  legacySectionToContent(section);

                return (
                  <section
                    key={section.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white/[0.96] shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900/90"
                  >
                    <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03] sm:px-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-emerald-300 dark:bg-emerald-300 dark:text-slate-950">
                            <FileText className="h-5 w-5" />
                          </div>
                          <h2 className="min-w-0 text-2xl font-black text-slate-950 dark:text-white">
                            {section.titulo}
                          </h2>
                        </div>
                        {isEditing && canEdit && (
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSection(section)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-300/10"
                              title="Editar seccion"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              title="Eliminar seccion"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <BlockRenderer content={blockContent} color="green" />
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <ContractSectionModal
        isOpen={showCreateModal}
        creating={creatingSection}
        materiaId={materiaId}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateSeccion}
      />
      <ContractSectionModal
        isOpen={Boolean(editingSection)}
        creating={creatingSection}
        materiaId={materiaId}
        initialTitle={editingSection?.titulo || ''}
        initialBlocks={editingSectionContent?.blocks || []}
        titleLabel="Editar seccion"
        submitLabel="Guardar cambios"
        onClose={() => setEditingSection(null)}
        onSave={handleUpdateSeccion}
      />
    </div>
  );
}

export default ContratoPedagogicoPage;
