import React, { useCallback, useState, useEffect } from 'react';
import { MaterialAcademicoRefBlock } from '../types/content-blocks';
import { materialAcademicoService, MaterialAcademico } from '../services';
import { BookOpen, Search } from 'lucide-react';

interface MaterialAcademicoRefBlockEditorProps {
  block: MaterialAcademicoRefBlock;
  onUpdate: (id: string, block: MaterialAcademicoRefBlock) => void;
  materiaId?: number;
}

export const MaterialAcademicoRefBlockEditor: React.FC<
  MaterialAcademicoRefBlockEditorProps
> = ({ block, onUpdate, materiaId }) => {
  const [materiales, setMateriales] = useState<MaterialAcademico[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadMateriales = useCallback(async () => {
    try {
      setLoading(true);
      let data: MaterialAcademico[];

      if (materiaId) {
        data = await materialAcademicoService.getByMateria(materiaId);
      } else {
        data = await materialAcademicoService.getAll();
      }

      setMateriales(data);
    } catch (error) {
      console.error('Error al cargar materiales:', error);
    } finally {
      setLoading(false);
    }
  }, [materiaId]);

  useEffect(() => {
    loadMateriales();
  }, [loadMateriales]);

  const handleSelectMaterial = (material: MaterialAcademico) => {
    onUpdate(block.id, {
      ...block,
      data: {
        materialId: material.id,
        titulo: material.titulo,
        categoria: material.categoria,
      },
    });
  };

  const filteredMateriales = materiales.filter(
    m =>
      m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.categoria?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const selectedMaterial = materiales.find(m => m.id === block.data.materialId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
        <BookOpen className="w-4 h-4" />
        <span>Referencia a Material Académico</span>
      </div>

      {/* Selected Material Display */}
      {selectedMaterial && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                {selectedMaterial.titulo}
              </div>
              {selectedMaterial.categoria && (
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  {selectedMaterial.categoria}
                </div>
              )}
              {selectedMaterial.descripcion && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {selectedMaterial.descripcion}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                onUpdate(block.id, {
                  ...block,
                  data: { materialId: 0, titulo: '', categoria: '' },
                });
              }}
              className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Material Selector */}
      {!selectedMaterial && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar material académico..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Materials List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando materiales...
            </div>
          ) : filteredMateriales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? 'No se encontraron materiales'
                : 'No hay materiales disponibles'}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-xl p-2">
              {filteredMateriales.map(material => (
                <button
                  key={material.id}
                  onClick={() => handleSelectMaterial(material)}
                  className="w-full text-left p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {material.titulo}
                  </div>
                  {material.categoria && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      {material.categoria}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
