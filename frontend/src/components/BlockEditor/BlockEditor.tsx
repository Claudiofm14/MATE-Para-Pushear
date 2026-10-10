import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, GripVertical } from 'lucide-react';
import {
  ContentBlock,
  BlockType,
  createEmptyBlock,
  getBlockIcon,
  getBlockTypeName,
} from '../../types/content-blocks';
import { BlockEditorItem } from './BlockEditorItem';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  materiaId?: number;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onChange,
  materiaId,
}) => {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(block => block.id === active.id);
      const newIndex = blocks.findIndex(block => block.id === over.id);

      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock = createEmptyBlock(type);
    onChange([...blocks, newBlock]);
    setShowBlockMenu(false);
    setFloatingMenuOpen(false);
  };

  const updateBlock = (id: string, updatedBlock: ContentBlock) => {
    onChange(blocks.map(block => (block.id === id ? updatedBlock : block)));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(block => block.id !== id));
  };

  const blockTypes: BlockType[] = [
    'text',
    'link',
    'commands',
    'list',
    'html-markdown',
    'image',
    'file',
    'material-academico-ref',
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-30 -mx-4 flex flex-col items-stretch gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          Bloques de Contenido
        </h3>
        <div className="relative sm:w-auto">
          <button
            type="button"
            onClick={() => setShowBlockMenu(!showBlockMenu)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:from-purple-700 hover:to-pink-700 sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Agregar Bloque
          </button>

          {/* Dropdown Menu */}
          {showBlockMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowBlockMenu(false)}
              ></div>
              <div className="absolute right-0 z-20 mt-2 max-h-72 w-56 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white shadow-md [scrollbar-color:#94a3b8_transparent] dark:border-gray-700 dark:bg-gray-800 dark:[scrollbar-color:#64748b_transparent]">
                {blockTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addBlock(type)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-sm"
                  >
                    <span className="text-2xl">{getBlockIcon(type)}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getBlockTypeName(type)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {type === 'text' && 'Texto con título y contenido'}
                        {type === 'link' && 'Enlace a recurso externo'}
                        {type === 'commands' && 'Comandos con descripción'}
                        {type === 'list' && 'Lista de items'}
                        {type === 'html-markdown' &&
                          'Contenido con formato HTML o Markdown'}
                        {type === 'image' && 'Imagen (máx. 5MB)'}
                        {type === 'file' && 'Archivo adjunto (máx. 5MB)'}
                        {type === 'material-academico-ref' &&
                          'Referencia a material académico'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {blocks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No hay bloques de contenido
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Haz clic en "Agregar Bloque" para comenzar
          </p>
        </div>
      )}

      {/* Blocks List with Drag & Drop */}
      {blocks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {blocks.map((block, index) => (
                <BlockEditorItem
                  key={block.id}
                  block={block}
                  index={index}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  materiaId={materiaId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Helper Text */}
      {blocks.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
          <GripVertical className="w-4 h-4" />
          <span>Arrastra los bloques para reordenarlos</span>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="sticky bottom-3 z-30 flex justify-end pointer-events-none">
          <div className="relative pointer-events-auto">
            <button
              type="button"
              onClick={() => setFloatingMenuOpen(!floatingMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar Bloque
            </button>

            {floatingMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setFloatingMenuOpen(false)}
                ></div>
                <div className="absolute bottom-full right-0 z-50 mb-2 max-h-72 w-56 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white shadow-md [scrollbar-color:#94a3b8_transparent] dark:border-gray-700 dark:bg-gray-800 dark:[scrollbar-color:#64748b_transparent]">
                  {blockTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addBlock(type)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span className="text-2xl">{getBlockIcon(type)}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getBlockTypeName(type)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockEditor;
