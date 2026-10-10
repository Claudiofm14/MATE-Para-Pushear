import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ContentBlock, MaterialContent } from '../types/content-blocks';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  ListChecks,
  TerminalSquare,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContentColorOption } from '../shared/design-system/contentColorPalette';
import { sanitizeRichHtml } from '../shared/utils/htmlSanitizer';

const MARKUP_CONTENT_CLASSES =
  'min-w-0 break-words leading-7 text-slate-700 dark:text-slate-200 ' +
  '[&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-slate-950 dark:[&_h1]:text-white ' +
  '[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-950 dark:[&_h2]:text-white ' +
  '[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-950 dark:[&_h3]:text-white ' +
  '[&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-slate-950 dark:[&_h4]:text-white ' +
  '[&_p]:my-3 [&_strong]:font-black [&_a]:font-bold [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-blue-400 ' +
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 ' +
  '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-400 [&_blockquote]:bg-cyan-50 [&_blockquote]:px-4 [&_blockquote]:py-1 [&_blockquote]:italic dark:[&_blockquote]:bg-cyan-950/30 ' +
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100 ' +
  '[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm dark:[&_code]:bg-slate-800 ' +
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-6 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700 ' +
  '[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_th]:text-left dark:[&_th]:border-slate-600 dark:[&_th]:bg-slate-800 ' +
  '[&_td]:border [&_td]:border-slate-300 [&_td]:p-2 dark:[&_td]:border-slate-600';

interface BlockRendererProps {
  content: MaterialContent;
  color?: string;
  collapseMarkdown?: boolean;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  content,
  color = 'blue',
  collapseMarkdown = false,
}) => {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [expandedMarkdownBlocks, setExpandedMarkdownBlocks] = useState<
    Set<string>
  >(new Set());
  const navigate = useNavigate();
  const { id: materiaId } = useParams<{ id: string }>();

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(id);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const getColorClasses = (blockColor?: string) => {
    const colorToUse = blockColor || color;
    const colorMap: Record<
      string,
      { gradient: string; bg: string; text: string; border: string }
    > = {
      blue: {
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
      },
      purple: {
        gradient: 'from-blue-500 to-emerald-500',
        bg: 'bg-purple-50 dark:bg-purple-900/10',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
      },
      green: {
        gradient: 'from-green-500 to-emerald-500',
        bg: 'bg-green-50 dark:bg-green-900/10',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
      },
      orange: {
        gradient: 'from-orange-500 to-amber-500',
        bg: 'bg-orange-50 dark:bg-orange-900/10',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
      },
      red: {
        gradient: 'from-red-500 to-rose-500',
        bg: 'bg-red-50 dark:bg-red-900/10',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
      },
      pink: {
        gradient: 'from-pink-500 to-rose-500',
        bg: 'bg-pink-50 dark:bg-pink-900/10',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-200 dark:border-pink-800',
      },
      gray: {
        gradient: 'from-gray-500 to-slate-500',
        bg: 'bg-gray-50 dark:bg-gray-900/10',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800',
      },
    };
    return colorMap[colorToUse] || colorMap.blue;
  };

  const downloadFile = (base64Data: string, fileName: string) => {
    try {
      // Crear un enlace temporal para descargar el archivo
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al descargar archivo:', err);
    }
  };

  const escapeHtml = (value: string): string =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const openImagePreview = (src: string, title: string) => {
    const previewWindow = window.open('', '_blank');

    if (!previewWindow) return;

    previewWindow.opener = null;
    previewWindow.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(title)}</title>
          <style>
            html,
            body {
              margin: 0;
              min-height: 100%;
              background: #020617;
            }

            body {
              display: grid;
              place-items: center;
              padding: 24px;
              box-sizing: border-box;
            }

            img {
              display: block;
              max-width: 100%;
              max-height: calc(100vh - 48px);
              object-fit: contain;
              border-radius: 12px;
              box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
            }
          </style>
        </head>
        <body>
          <img src="${src}" alt="${escapeHtml(title)}" />
        </body>
      </html>
    `);
    previewWindow.document.close();
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getTextBlockClassName = (
    block: Extract<ContentBlock, { type: 'text' }>
  ) => {
    const fontMap: Record<string, string> = {
      sans: 'font-sans',
      serif: 'font-serif',
      mono: 'font-mono',
    };
    const sizeMap: Record<string, string> = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    };
    const alignMap: Record<string, string> = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    };

    return [
      'break-words leading-8 whitespace-pre-wrap',
      getContentColorOption(block.data.colorPreset || 'slate').className,
      fontMap[block.data.fontFamily || 'sans'],
      sizeMap[block.data.fontSize || 'base'],
      alignMap[block.data.align || 'left'],
      block.data.bold ? 'font-bold' : 'font-normal',
      block.data.italic ? 'italic' : '',
      block.data.underline ? 'underline' : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  const getTextBlockTitleClassName = (
    block: Extract<ContentBlock, { type: 'text' }>
  ) => {
    const sizeMap: Record<string, string> = {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    };
    const alignMap: Record<string, string> = {
      left: 'justify-start text-left',
      center: 'justify-center text-center',
      right: 'justify-end text-right',
      justify: 'justify-start text-justify',
    };

    return [
      'w-full min-w-0 break-words font-bold flex items-start gap-2',
      getContentColorOption(block.data.titleColorPreset || 'neutral').className,
      sizeMap[block.data.titleFontSize || 'lg'],
      alignMap[block.data.titleAlign || 'left'],
    ]
      .filter(Boolean)
      .join(' ');
  };

  const renderBlock = (block: ContentBlock, _index?: number) => {
    void _index;
    const colors = getColorClasses();

    switch (block.type) {
      case 'text':
        return (
          <section
            key={block.id}
            className="min-w-0 space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/75 dark:shadow-black/10 sm:p-6"
          >
            {block.data.titulo && (
              <h3 className={getTextBlockTitleClassName(block)}>
                {block.data.emoji && (
                  <span className="text-xl leading-none">
                    {block.data.emoji}
                  </span>
                )}
                {block.data.titulo}
              </h3>
            )}
            {block.data.contenido && (
              <div className={getTextBlockClassName(block)}>
                {block.data.contenido}
              </div>
            )}
          </section>
        );

      case 'link':
        return (
          <article
            key={block.id}
            className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-950/10 dark:border-white/10 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-black/20 sm:p-5"
          >
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/60">
                  <Link2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="mb-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    Recurso
                  </span>
                  <h4 className="break-words text-lg font-black leading-snug text-slate-950 dark:text-white">
                    {block.data.titulo || block.data.textoBoton || 'Enlace'}
                  </h4>
                  {block.data.descripcion && (
                    <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                      {block.data.descripcion}
                    </p>
                  )}
                </div>
              </div>

              {block.data.url && (
                <a
                  href={block.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 max-w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-blue-500 sm:w-auto"
                >
                  <span className="min-w-0 truncate">
                    {block.data.textoBoton || 'Abrir recurso'}
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
              )}
            </div>
          </article>
        );

      case 'commands':
        return (
          <section
            key={block.id}
            className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg shadow-slate-950/15 dark:border-slate-700"
          >
            {block.data.titulo && (
              <h4 className="flex items-center gap-2 border-b border-white/10 px-4 py-3 font-black text-slate-100">
                <TerminalSquare className="h-5 w-5 text-emerald-300" />
                {block.data.titulo}
              </h4>
            )}
            <div className="space-y-3 p-4">
              {block.data.commands.map(
                (
                  command: { comando: string; descripcion: string },
                  cmdIndex: number
                ) => (
                  <div key={cmdIndex} className="space-y-2">
                    {command.comando && (
                      <div className="group relative min-w-0">
                        <div className="flex min-w-0 items-center justify-between rounded-xl border border-white/10 bg-black/35 p-3 sm:p-4">
                          <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-sm text-green-400">
                            {command.comando}
                          </code>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                command.comando,
                                `${block.id}-${cmdIndex}`
                              )
                            }
                            className="ml-3 flex shrink-0 items-center gap-2 rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                            title="Copiar comando"
                          >
                            {copiedCommand === `${block.id}-${cmdIndex}` ? (
                              <>
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400">
                                  Copiado
                                </span>
                              </>
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {command.descripcion && (
                      <p className="break-words pl-1 text-sm font-medium text-slate-300">
                        {command.descripcion}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        );

      case 'list':
        return (
          <section
            key={block.id}
            className="min-w-0 space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/75 dark:shadow-black/10 sm:p-6"
          >
            {block.data.titulo && (
              <h4 className="flex items-center gap-2 break-words text-lg font-black text-slate-950 dark:text-white">
                <ListChecks className="h-5 w-5 text-blue-500" />
                {block.data.titulo}
              </h4>
            )}
            <ul className="space-y-2">
              {block.data.items.map(
                (item: { texto: string }, itemIndex: number) => (
                  <li
                    key={itemIndex}
                    className="flex min-w-0 items-start gap-3"
                  >
                    <span
                      className={`flex-shrink-0 w-6 h-6 flex items-center justify-center ${colors.bg} ${colors.text} rounded-full text-xs font-bold mt-0.5`}
                    >
                      •
                    </span>
                    <span className="min-w-0 flex-1 break-words leading-relaxed text-gray-700 dark:text-gray-300">
                      {item.texto}
                    </span>
                  </li>
                )
              )}
            </ul>
          </section>
        );

      case 'html-markdown':
        if (!block.data.contenido) return null;

        if (collapseMarkdown && block.data.formato === 'markdown') {
          const isExpanded = expandedMarkdownBlocks.has(block.id);
          const contentId = `markdown-content-${block.id}`;

          return (
            <section
              key={block.id}
              className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/75 dark:shadow-black/10"
            >
              <button
                type="button"
                className="flex w-full min-w-0 items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 dark:hover:bg-white/5 sm:p-6"
                aria-expanded={isExpanded}
                aria-controls={contentId}
                aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} contenido de ${
                  block.data.titulo || 'Contenido Markdown'
                }`}
                onClick={() =>
                  setExpandedMarkdownBlocks(current => {
                    const next = new Set(current);
                    if (next.has(block.id)) next.delete(block.id);
                    else next.add(block.id);
                    return next;
                  })
                }
              >
                <span className="min-w-0">
                  <span className="block break-words text-xl font-black text-slate-950 dark:text-white">
                    {block.data.titulo || 'Contenido Markdown'}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {isExpanded ? 'Ocultar contenido' : 'Ver contenido'}
                  </span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-300 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isExpanded && (
                <div
                  id={contentId}
                  className="border-t border-slate-200/70 p-5 dark:border-white/10 sm:p-6"
                >
                  <div className={MARKUP_CONTENT_CLASSES}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => {
                          void node;
                          return (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          );
                        },
                      }}
                    >
                      {block.data.contenido}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </section>
          );
        }

        return (
          <section
            key={block.id}
            className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/75 dark:shadow-black/10 sm:p-6"
          >
            {block.data.titulo && (
              <h3 className="break-words text-xl font-black text-slate-950 dark:text-white">
                {block.data.titulo}
              </h3>
            )}

            {block.data.formato === 'html' ? (
              <div
                className={MARKUP_CONTENT_CLASSES}
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichHtml(block.data.contenido),
                }}
              />
            ) : (
              <div className={MARKUP_CONTENT_CLASSES}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => {
                      void node;
                      return (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      );
                    },
                  }}
                >
                  {block.data.contenido}
                </ReactMarkdown>
              </div>
            )}
          </section>
        );

      case 'image':
        if (!block.data.base64Data) return null;
        return (
          <section
            key={block.id}
            className="min-w-0 space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/75 dark:shadow-black/10 sm:p-6"
          >
            {block.data.titulo && (
              <h4 className="flex items-center gap-2 break-words text-lg font-black text-slate-950 dark:text-white">
                <ImageIcon className="h-5 w-5 text-pink-500" />
                {block.data.titulo}
              </h4>
            )}
            {block.data.descripcion && (
              <p className="break-words text-sm text-gray-600 dark:text-gray-400">
                {block.data.descripcion}
              </p>
            )}
            <div
              className={`overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-700 ${
                block.data.size === 'small'
                  ? 'max-w-xs mx-auto'
                  : block.data.size === 'medium'
                    ? 'max-w-md mx-auto'
                    : block.data.size === 'large'
                      ? 'max-w-2xl mx-auto'
                      : 'w-full'
              }`}
            >
              <img
                src={block.data.base64Data}
                alt={block.data.alt || block.data.titulo || 'Imagen'}
                className="w-full h-auto cursor-zoom-in hover:opacity-95 transition-opacity"
                onClick={() =>
                  openImagePreview(
                    block.data.base64Data,
                    block.data.alt ||
                      block.data.titulo ||
                      block.data.fileName ||
                      'Imagen'
                  )
                }
                title="Click para ampliar"
              />
            </div>
            {block.data.fileName && (
              <div className="break-words text-xs italic text-gray-500 dark:text-gray-400">
                {block.data.fileName}
              </div>
            )}
          </section>
        );

      case 'file':
        if (!block.data.base64Data) return null;
        return (
          <section
            key={block.id}
            className="min-w-0 space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/75 dark:shadow-black/10 sm:p-6"
          >
            {block.data.titulo && (
              <h4 className="flex items-center gap-2 break-words text-lg font-black text-slate-950 dark:text-white">
                <FileText className="h-5 w-5 text-indigo-500" />
                {block.data.titulo}
              </h4>
            )}
            {block.data.descripcion && (
              <p className="break-words text-sm text-gray-600 dark:text-gray-400">
                {block.data.descripcion}
              </p>
            )}
            <div className="min-w-0 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/10">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📎</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {block.data.fileName}
                    </div>
                    {block.data.fileSize && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(block.data.fileSize)}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    downloadFile(block.data.base64Data, block.data.fileName)
                  }
                  className="inline-flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-sm sm:w-auto"
                  title="Descargar archivo"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
              </div>
            </div>
          </section>
        );

      case 'material-academico-ref': {
        if (!block.data.materialId) return null;

        const handleMaterialClick = () => {
          // Guardar el ID del material a resaltar
          sessionStorage.setItem(
            'scrollToMaterial',
            block.data.materialId.toString()
          );

          // Navegar a la página de material académico de esta materia
          if (materiaId) {
            navigate(`/materia/${materiaId}/material`);
          } else {
            // Fallback si no hay materiaId en la URL
            navigate('/material-academico');
          }
        };

        return (
          <div
            key={block.id}
            className={`min-w-0 space-y-3 rounded-xl border-2 p-4 transition-all hover:shadow-sm sm:p-5 ${colors.bg} ${colors.border}`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${colors.gradient} rounded-lg flex items-center justify-center`}
              >
                <span className="text-xl">📚</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex min-w-0 items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    Material Académico
                  </span>
                </div>
                {block.data.titulo && (
                  <h4
                    className={`mb-1 break-words text-lg font-bold ${colors.text}`}
                  >
                    {block.data.titulo}
                  </h4>
                )}
                {block.data.categoria && (
                  <p className="break-words text-sm text-gray-600 dark:text-gray-400">
                    {block.data.categoria}
                  </p>
                )}
                <button
                  onClick={handleMaterialClick}
                  className={`mt-3 inline-flex max-w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-sm ${colors.gradient}`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Material
                </button>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (!content || !content.blocks || content.blocks.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {content.blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default BlockRenderer;
