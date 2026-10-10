import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  GripVertical,
  Italic,
  Palette,
  Plus,
  Trash2,
  Underline,
  Upload,
  X,
} from 'lucide-react';
import {
  ContentBlock,
  TextBlock,
  LinkBlock,
  CommandsBlock,
  ListBlock,
  HtmlMarkdownBlock,
  ImageBlock,
  FileBlock,
  getBlockIcon,
  getBlockTypeName,
} from '../../types/content-blocks';
import { MaterialAcademicoRefBlockEditor } from '../MaterialAcademicoRefBlockEditor';
import {
  CONTENT_COLOR_PALETTE,
  ContentColorPreset,
} from '../../shared/design-system/contentColorPalette';

interface BlockEditorItemProps {
  block: ContentBlock;
  index: number;
  onUpdate: (id: string, block: ContentBlock) => void;
  onRemove: (id: string) => void;
  materiaId?: number;
}

export const BlockEditorItem: React.FC<BlockEditorItemProps> = ({
  block,
  index,
  onUpdate,
  onRemove,
  materiaId,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getColorClasses = () => {
    const colors = {
      text: {
        bg: 'bg-purple-50 dark:bg-purple-900/10',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-600 dark:text-purple-400',
      },
      link: {
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-400',
      },
      commands: {
        bg: 'bg-green-50 dark:bg-green-900/10',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-600 dark:text-green-400',
      },
      list: {
        bg: 'bg-orange-50 dark:bg-orange-900/10',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-600 dark:text-orange-400',
      },
      'html-markdown': {
        bg: 'bg-cyan-50 dark:bg-cyan-900/10',
        border: 'border-cyan-200 dark:border-cyan-800',
        text: 'text-cyan-700 dark:text-cyan-400',
      },
      image: {
        bg: 'bg-pink-50 dark:bg-pink-900/10',
        border: 'border-pink-200 dark:border-pink-800',
        text: 'text-pink-600 dark:text-pink-400',
      },
      file: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/10',
        border: 'border-indigo-200 dark:border-indigo-800',
        text: 'text-indigo-600 dark:text-indigo-400',
      },
      'material-academico-ref': {
        bg: 'bg-purple-50 dark:bg-purple-900/10',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-600 dark:text-purple-400',
      },
    };
    return colors[block.type];
  };

  const colors = getColorClasses();

  const renderBlockEditor = () => {
    switch (block.type) {
      case 'text':
        return <TextBlockEditor block={block} onUpdate={onUpdate} />;
      case 'link':
        return <LinkBlockEditor block={block} onUpdate={onUpdate} />;
      case 'commands':
        return <CommandsBlockEditor block={block} onUpdate={onUpdate} />;
      case 'list':
        return <ListBlockEditor block={block} onUpdate={onUpdate} />;
      case 'html-markdown':
        return <HtmlMarkdownBlockEditor block={block} onUpdate={onUpdate} />;
      case 'image':
        return <ImageBlockEditor block={block} onUpdate={onUpdate} />;
      case 'file':
        return <FileBlockEditor block={block} onUpdate={onUpdate} />;
      case 'material-academico-ref':
        return (
          <MaterialAcademicoRefBlockEditor
            block={block}
            onUpdate={onUpdate}
            materiaId={materiaId}
          />
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${colors.bg} ${colors.border} border-2 rounded-xl overflow-hidden transition-all ${
        isDragging ? 'shadow-2xl scale-105' : 'shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </button>
          <span className="text-2xl">{getBlockIcon(block.type)}</span>
          <div>
            <div className={`text-sm font-semibold ${colors.text}`}>
              Bloque {index + 1}: {getBlockTypeName(block.type)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(block.id)}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Eliminar bloque"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">{renderBlockEditor()}</div>
    </div>
  );
};

// HTML / Markdown Block Editor
const HtmlMarkdownBlockEditor: React.FC<{
  block: HtmlMarkdownBlock;
  onUpdate: (id: string, block: ContentBlock) => void;
}> = ({ block, onUpdate }) => {
  const updateData = <K extends keyof HtmlMarkdownBlock['data']>(
    field: K,
    value: HtmlMarkdownBlock['data'][K]
  ) => {
    onUpdate(block.id, {
      ...block,
      data: { ...block.data, [field]: value },
    });
  };

  const isMarkdown = block.data.formato === 'markdown';

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.data.titulo || ''}
        onChange={e => updateData('titulo', e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        placeholder="Título (opcional)"
      />

      <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-800">
        {(['markdown', 'html'] as const).map(formato => (
          <button
            key={formato}
            type="button"
            onClick={() => updateData('formato', formato)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              block.data.formato === formato
                ? 'bg-cyan-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {formato === 'markdown' ? 'Markdown' : 'HTML'}
          </button>
        ))}
      </div>

      <textarea
        value={block.data.contenido}
        onChange={e => updateData('contenido', e.target.value)}
        rows={12}
        spellCheck={isMarkdown}
        className="w-full resize-y rounded-lg border border-gray-300 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-600"
        placeholder={
          isMarkdown
            ? '# Título\n\nEscribí contenido con **negrita**, listas y enlaces.'
            : '<h2>Título</h2>\n<p>Escribí aquí tu contenido HTML.</p>'
        }
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isMarkdown
          ? 'Admite títulos, listas, enlaces, citas y bloques de código.'
          : 'El HTML se sanitiza al mostrarlo; scripts, eventos y estilos inseguros se eliminan.'}
      </p>
    </div>
  );
};

// Text Block Editor
const TextBlockEditor: React.FC<{
  block: TextBlock;
  onUpdate: (id: string, block: ContentBlock) => void;
}> = ({ block, onUpdate }) => {
  const updateData = (
    field: keyof TextBlock['data'],
    value: string | boolean
  ) => {
    onUpdate(block.id, {
      ...block,
      data: { ...block.data, [field]: value },
    });
  };

  const alignOptions = [
    { value: 'left', label: 'Izquierda', icon: AlignLeft },
    { value: 'center', label: 'Centrar', icon: AlignCenter },
    { value: 'right', label: 'Derecha', icon: AlignRight },
    { value: 'justify', label: 'Justificar', icon: AlignJustify },
  ];
  const bodySizeOptions = [
    { value: 'xs', label: 'Muy chico' },
    { value: 'sm', label: 'Chico' },
    { value: 'base', label: 'Normal' },
    { value: 'lg', label: 'Grande' },
    { value: 'xl', label: 'Muy grande' },
    { value: '2xl', label: 'Extra grande' },
  ];
  const titleSizeOptions = [
    { value: 'sm', label: 'Chico' },
    { value: 'base', label: 'Normal' },
    { value: 'lg', label: 'Grande' },
    { value: 'xl', label: 'Muy grande' },
    { value: '2xl', label: 'Extra grande' },
    { value: '3xl', label: 'Principal' },
  ];
  const quickEmojis = ['📌', '✅', '⚠️', '💡', '📚', '🎯', '📝', '🔗'];

  const selectedTitleColor = block.data.titleColorPreset || 'neutral';
  const selectedBodyColor = block.data.colorPreset || 'slate';

  const renderColorControl = (
    label: string,
    selectedValue: string,
    onSelect: (value: ContentColorPreset) => void
  ) => {
    const selectedOption =
      CONTENT_COLOR_PALETTE.find(option => option.value === selectedValue) ||
      CONTENT_COLOR_PALETTE[0];

    return (
      <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-900/40">
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
          <Palette className="h-3.5 w-3.5" />
          {label}
        </div>
        <span className="flex shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-600">
          <span
            className="h-4 w-4"
            style={{ backgroundColor: selectedOption.lightHex }}
            aria-label="Modo claro"
          />
          <span
            className="h-4 w-4"
            style={{ backgroundColor: selectedOption.darkHex }}
            aria-label="Modo oscuro"
          />
        </span>
        <select
          value={selectedValue}
          onChange={e => onSelect(e.target.value as ContentColorPreset)}
          className="h-8 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 outline-none focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          title={label}
        >
          {CONTENT_COLOR_PALETTE.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[72px_1fr]">
        <select
          value={block.data.emoji || ''}
          onChange={e => updateData('emoji', e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-center text-sm font-semibold outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          title="Emoji del bloque"
        >
          <option value="">Emoji</option>
          {block.data.emoji && !quickEmojis.includes(block.data.emoji) && (
            <option value={block.data.emoji}>{block.data.emoji}</option>
          )}
          {quickEmojis.map(emoji => (
            <option key={emoji} value={emoji}>
              {emoji}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={block.data.titulo}
          onChange={e => updateData('titulo', e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="Titulo de la seccion"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-800">
        <span className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          Titulo
        </span>
        <select
          value={block.data.titleFontSize || 'lg'}
          onChange={e => updateData('titleFontSize', e.target.value)}
          className="h-8 rounded-md border border-gray-300 bg-gray-50 px-2 text-xs text-gray-700 outline-none focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          title="Tamano del titulo"
        >
          {titleSizeOptions.map(size => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <div className="flex rounded-md border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
          {alignOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateData('titleAlign', value)}
              className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${(block.data.titleAlign || 'left') === value ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              title={`${label} titulo`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        {renderColorControl('Color titulo', selectedTitleColor, value =>
          updateData('titleColorPreset', value)
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-800">
        <span className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          Cuerpo
        </span>
        <select
          value={block.data.fontFamily || 'sans'}
          onChange={e => updateData('fontFamily', e.target.value)}
          className="h-8 rounded-md border border-gray-300 bg-gray-50 px-2 text-xs text-gray-700 outline-none focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          title="Tipografia"
        >
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
        </select>
        <select
          value={block.data.fontSize || 'base'}
          onChange={e => updateData('fontSize', e.target.value)}
          className="h-8 rounded-md border border-gray-300 bg-gray-50 px-2 text-xs text-gray-700 outline-none focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          title="Tamano"
        >
          {bodySizeOptions.map(size => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        {renderColorControl('Color cuerpo', selectedBodyColor, value =>
          updateData('colorPreset', value)
        )}
        <button
          type="button"
          onClick={() => updateData('bold', !block.data.bold)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${block.data.bold ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => updateData('italic', !block.data.italic)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${block.data.italic ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => updateData('underline', !block.data.underline)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${block.data.underline ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          title="Subrayado"
        >
          <Underline className="h-4 w-4" />
        </button>
        <div className="flex rounded-md border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
          {alignOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateData('align', value)}
              className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${(block.data.align || 'left') === value ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        value={block.data.titulo}
        onChange={e => updateData('titulo', e.target.value)}
        className="hidden"
        placeholder="Título de la sección"
      />
      <textarea
        value={block.data.contenido}
        onChange={e => updateData('contenido', e.target.value)}
        rows={5}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none dark:text-white resize-none text-sm"
        placeholder="Contenido de la sección..."
      />
    </div>
  );
};

// Link Block Editor
const LinkBlockEditor: React.FC<{
  block: LinkBlock;
  onUpdate: (id: string, block: ContentBlock) => void;
}> = ({ block, onUpdate }) => {
  const updateData = (field: keyof LinkBlock['data'], value: string) => {
    onUpdate(block.id, {
      ...block,
      data: { ...block.data, [field]: value },
    });
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.data.titulo}
        onChange={e => updateData('titulo', e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white text-sm font-medium"
        placeholder="Título del enlace"
      />
      <input
        type="url"
        value={block.data.url}
        onChange={e => updateData('url', e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white text-sm font-mono"
        placeholder="https://..."
      />
      <input
        type="text"
        value={block.data.descripcion || ''}
        onChange={e => updateData('descripcion', e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white text-sm"
        placeholder="Descripción (opcional)"
      />
      <input
        type="text"
        value={block.data.textoBoton || 'Ver Recurso'}
        onChange={e => updateData('textoBoton', e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white text-sm"
        placeholder="Texto del botón"
      />
    </div>
  );
};

// Commands Block Editor
const CommandsBlockEditor: React.FC<{
  block: CommandsBlock;
  onUpdate: (id: string, block: ContentBlock) => void;
}> = ({ block, onUpdate }) => {
  const addCommand = () => {
    onUpdate(block.id, {
      ...block,
      data: {
        ...block.data,
        commands: [...block.data.commands, { comando: '', descripcion: '' }],
      },
    });
  };

  const updateCommand = (
    index: number,
    field: 'comando' | 'descripcion',
    value: string
  ) => {
    const newCommands = [...block.data.commands];
    newCommands[index] = { ...newCommands[index], [field]: value };
    onUpdate(block.id, {
      ...block,
      data: { ...block.data, commands: newCommands },
    });
  };

  const removeCommand = (index: number) => {
    onUpdate(block.id, {
      ...block,
      data: {
        ...block.data,
        commands: block.data.commands.filter((_, i) => i !== index),
      },
    });
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.data.titulo || ''}
        onChange={e =>
          onUpdate(block.id, {
            ...block,
            data: { ...block.data, titulo: e.target.value },
          })
        }
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none dark:text-white text-sm font-medium"
        placeholder="Título (opcional)"
      />

      {block.data.commands.map((cmd, index) => (
        <div
          key={index}
          className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 space-y-2"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Comando {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeCommand(index)}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <input
            type="text"
            value={cmd.comando}
            onChange={e => updateCommand(index, 'comando', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 text-green-400 font-mono border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none text-sm"
            placeholder="git clone [URL]"
          />
          <input
            type="text"
            value={cmd.descripcion}
            onChange={e => updateCommand(index, 'descripcion', e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none dark:text-white text-sm"
            placeholder="Descripción del comando"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addCommand}
        className="w-full px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar Comando
      </button>
    </div>
  );
};

// List Block Editor
const ListBlockEditor: React.FC<{
  block: ListBlock;
  onUpdate: (id: string, block: ContentBlock) => void;
}> = ({ block, onUpdate }) => {
  const addItem = () => {
    onUpdate(block.id, {
      ...block,
      data: {
        ...block.data,
        items: [...block.data.items, { texto: '' }],
      },
    });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...block.data.items];
    newItems[index] = { texto: value };
    onUpdate(block.id, {
      ...block,
      data: { ...block.data, items: newItems },
    });
  };

  const removeItem = (index: number) => {
    onUpdate(block.id, {
      ...block,
      data: {
        ...block.data,
        items: block.data.items.filter((_, i) => i !== index),
      },
    });
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.data.titulo || ''}
        onChange={e =>
          onUpdate(block.id, {
            ...block,
            data: { ...block.data, titulo: e.target.value },
          })
        }
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none dark:text-white text-sm font-medium"
        placeholder="Título (opcional)"
      />

      {block.data.items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-semibold">
            {index + 1}
          </span>
          <input
            type="text"
            value={item.texto}
            onChange={e => updateItem(index, e.target.value)}
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none dark:text-white text-sm"
            placeholder="Texto del item..."
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full px-3 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar Item
      </button>
    </div>
  );
};

// Image Block Editor
const ImageBlockEditor: React.FC<{
  block: ImageBlock;
  onUpdate: (id: string, block: ContentBlock) => void;
}> = ({ block, onUpdate }) => {
  const [error, setError] = React.useState<string>('');
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB en bytes

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }

    // Validar tamaño
    if (file.size > MAX_SIZE) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    // Convertir a Base64
    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      onUpdate(block.id, {
        ...block,
        data: {
          ...block.data,
          fileName: file.name,
          fileType: file.type,
          base64Data: base64,
        },
      });
    };
    reader.onerror = () => {
      setError('Error al cargar la imagen');
    };
    reader.readAsDataURL(file);
  };

  const updateData = (field: keyof ImageBlock['data'], value: string) => {
    onUpdate(block.id, {
      ...block,
      data: { ...block.data, [field]: value },
    });
  };

  const clearImage = () => {
    onUpdate(block.id, {
      ...block,
      data: {
        ...block.data,
        fileName: '',
        fileType: '',
        base64Data: '',
      },
    });
    setError('');
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.data.titulo || ''}
        onChange={e => updateData('titulo', e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none dark:text-white text-sm font-medium"
        placeholder="Título (opcional)"
      />

      <input
        type="text"
        value={block.data.descripcion || ''}
        onChange={e => updateData('descripcion', e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none dark:text-white text-sm"
        placeholder="Descripción (opcional)"
      />

      <input
        type="text"
        value={block.data.alt || ''}
        onChange={e => updateData('alt', e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none dark:text-white text-sm"
        placeholder="Texto alternativo (opcional)"
      />

      <div className="flex flex-wrap gap-2">
        {[
          { value: 'small', label: 'Pequeño' },
          { value: 'medium', label: 'Mediano' },
          { value: 'large', label: 'Grande' },
          { value: 'full', label: 'Completo' },
        ].map(size => (
          <button
            key={size.value}
            type="button"
            onClick={() => updateData('size', size.value as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              (block.data.size || 'full') === size.value
                ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {size.label}
          </button>
        ))}
      </div>

      {!block.data.base64Data ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <label className="cursor-pointer flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-pink-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Click para seleccionar una imagen
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Tamaño máximo: 5MB
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative group">
            <img
              src={block.data.base64Data}
              alt={block.data.alt || 'Preview'}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Eliminar imagen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className="font-medium">{block.data.fileName}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

// File Block Editor
const FileBlockEditor: React.FC<{
  block: FileBlock;
  onUpdate: (id: string, block: ContentBlock) => void;
}> = ({ block, onUpdate }) => {
  const [error, setError] = React.useState<string>('');
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB en bytes

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validar tamaño
    if (file.size > MAX_SIZE) {
      setError('El archivo no debe superar los 5MB');
      return;
    }

    // Convertir a Base64
    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      onUpdate(block.id, {
        ...block,
        data: {
          ...block.data,
          fileName: file.name,
          fileType: file.type,
          base64Data: base64,
          fileSize: file.size,
        },
      });
    };
    reader.onerror = () => {
      setError('Error al cargar el archivo');
    };
    reader.readAsDataURL(file);
  };

  const updateData = (field: keyof FileBlock['data'], value: string) => {
    onUpdate(block.id, {
      ...block,
      data: { ...block.data, [field]: value },
    });
  };

  const clearFile = () => {
    onUpdate(block.id, {
      ...block,
      data: {
        ...block.data,
        fileName: '',
        fileType: '',
        base64Data: '',
        fileSize: 0,
      },
    });
    setError('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.data.titulo || ''}
        onChange={e => updateData('titulo', e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none dark:text-white text-sm font-medium"
        placeholder="Título (opcional)"
      />

      <input
        type="text"
        value={block.data.descripcion || ''}
        onChange={e => updateData('descripcion', e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none dark:text-white text-sm"
        placeholder="Descripción (opcional)"
      />

      {!block.data.base64Data ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <label className="cursor-pointer flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-indigo-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Click para seleccionar un archivo
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Tamaño máximo: 5MB
            </span>
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">📎</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {block.data.fileName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(block.data.fileSize || 0)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Eliminar archivo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default BlockEditorItem;
