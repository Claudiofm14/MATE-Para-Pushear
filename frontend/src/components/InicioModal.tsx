import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Layers3, Save, Sparkles, X } from 'lucide-react';
import { BlockEditor } from './BlockEditor';
import { ContentBlock, MaterialContent } from '../types/content-blocks';

interface Contenedor {
  titulo?: string;
  subtitulo?: string;
  tipo: string;
  hijos?: Contenedor[];
}

interface InicioFormData {
  titulo: string;
  materiaId: number;
  contenedores: Contenedor[];
  contenido?: MaterialContent | null;
}

interface InicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InicioFormData) => Promise<void>;
  materiaId: number;
  materiaNombre: string;
  inicioExistente?: {
    id: number;
    titulo: string;
    contenedores?: any[];
    contenido?: MaterialContent | null;
  } | null;
}

const legacyContenedoresToBlocks = (contenedores: any[] = []): ContentBlock[] =>
  contenedores
    .map(contenedor => {
      const id =
        Date.now().toString() + Math.random().toString(36).substring(2, 9);

      if (contenedor.tipo === 'canalDeComunicacion') {
        const firstLink = contenedor.hijos?.[0];
        return {
          id,
          type: 'link',
          data: {
            titulo: firstLink?.titulo || contenedor.titulo || '',
            url: firstLink?.subtitulo || contenedor.subtitulo || '',
            descripcion: contenedor.subtitulo || '',
            textoBoton: 'Ingresar',
          },
        } as ContentBlock;
      }

      const childText =
        contenedor.hijos
          ?.filter((hijo: any) => hijo.titulo || hijo.subtitulo)
          .map((hijo: any) =>
            [hijo.titulo, hijo.subtitulo].filter(Boolean).join(': ')
          )
          .join('\n') || '';

      return {
        id,
        type: 'text',
        data: {
          titulo: contenedor.titulo || '',
          contenido: [contenedor.subtitulo, childText]
            .filter(Boolean)
            .join('\n\n'),
        },
      } as ContentBlock;
    })
    .filter(block => {
      if (block.type === 'text') {
        return block.data.titulo || block.data.contenido;
      }
      if (block.type === 'link') {
        return block.data.titulo || block.data.url || block.data.descripcion;
      }
      return true;
    });

export const InicioModal: React.FC<InicioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  materiaId,
  materiaNombre,
  inicioExistente,
}) => {
  const [titulo, setTitulo] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setTitulo(inicioExistente?.titulo || materiaNombre);
    setBlocks(
      inicioExistente?.contenido?.blocks?.length
        ? inicioExistente.contenido.blocks
        : legacyContenedoresToBlocks(inicioExistente?.contenedores || [])
    );
    setError(null);
  }, [inicioExistente, isOpen, materiaNombre]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      setError('El titulo del inicio es obligatorio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        titulo: titulo.trim(),
        materiaId,
        contenedores: [],
        contenido: blocks.length > 0 ? { blocks } : null,
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar inicio:', error);
      setError('Error al guardar el inicio. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-md transition-opacity dark:bg-slate-900/55"
        onClick={onClose}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-5xl transform transition-all">
          <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 dark:border-slate-600 dark:bg-slate-900 dark:shadow-slate-950/35 sm:max-h-[90dvh]">
            <div className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.24),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#e0f2fe_52%,#d1fae5_100%)] p-4 dark:border-slate-600 dark:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.22),transparent_34%),linear-gradient(135deg,#1e293b_0%,#1d4ed8_52%,#0f766e_100%)] sm:p-7">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="relative flex min-w-0 items-start gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-950/25 sm:h-14 sm:w-14 sm:rounded-2xl">
                    <BookOpen className="h-5 w-5 sm:h-7 sm:w-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-slate-600 dark:bg-slate-800 dark:text-emerald-100 sm:mb-2 sm:gap-2 sm:px-3 sm:text-xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      Portada de materia
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                      {inicioExistente ? 'Editar Inicio' : 'Crear Inicio'}
                    </h2>
                    <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-slate-600 dark:text-slate-200 sm:mt-2 sm:text-base sm:leading-6">
                      Arma la portada de {materiaNombre} con bloques libres de
                      contenido, igual que en semanas.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="relative shrink-0 rounded-xl border border-slate-200 bg-white/80 p-1.5 text-slate-600 transition-all hover:bg-white hover:text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white sm:rounded-2xl sm:p-2"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%),#f8fafc] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_30%),#111827]"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto p-4 [scrollbar-color:#94a3b8_transparent] dark:[scrollbar-color:#64748b_transparent] sm:space-y-6 sm:p-6">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-300/30 dark:bg-red-500/10 dark:text-red-100">
                    {error}
                  </div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-white/80 dark:border-slate-600 dark:bg-slate-800/70 p-4 shadow-xl shadow-black/10 sm:p-5">
                  <label
                    htmlFor="titulo"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Titulo del inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="titulo"
                    type="text"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                    placeholder="Ej: Bienvenidos a la materia"
                  />
                </div>

                <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white/80 dark:border-emerald-300/25 dark:bg-slate-800/70 shadow-2xl shadow-black/15">
                  <div className="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
                          <Layers3 className="h-5 w-5 text-emerald-300" />
                          Contenido del inicio
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">
                          Agrega texto, enlaces, listas, comandos, imagenes,
                          archivos o referencias a material academico.
                        </p>
                      </div>
                      <span className="inline-flex w-fit items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-100">
                        Bloques editables
                      </span>
                    </div>
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

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-900/95 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-300 disabled:translate-y-0 disabled:opacity-50 sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  {loading
                    ? 'Guardando...'
                    : inicioExistente
                      ? 'Guardar Cambios'
                      : 'Crear Inicio'}
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

export default InicioModal;
