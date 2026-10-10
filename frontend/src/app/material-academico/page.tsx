import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { materialAcademicoService, MaterialAcademico } from '../../services';
import { useToast, usePermissions, useConfirm } from '../../hooks';
import { useMateriaConfig } from '../../hooks/useMateriaConfig';
import { useMateriaCursada } from '../../hooks/useMateriaCursada';
import { MaterialAcademicoFormModal } from '../../components/MaterialAcademicoFormModal';
import { MaterialRenderer } from '../../components/MaterialRenderer';
import { MateriaAccessGuard } from '../../components/MateriaAccessGuard';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../shared/design-system/components/Button';
import {
  BookOpen,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ListOrdered,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const MaterialAcademicoPage: React.FC = () => {
  const { id: materiaId } = useParams<{ id: string }>();
  const toast = useToast();
  const { canEdit } = usePermissions();
  const { config } = useMateriaConfig(materiaId ? Number(materiaId) : null);
  const { cursadaId, loadingCursada } = useMateriaCursada(
    materiaId ? Number(materiaId) : null
  );
  const { confirmState, confirm } = useConfirm();
  const { isInitialized, authenticated } = useAuth();

  const [materiales, setMateriales] = useState<MaterialAcademico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<MaterialAcademico | null>(null);
  const [isCategoryOrderOpen, setIsCategoryOrderOpen] = useState(false);
  const [draftCategoryOrder, setDraftCategoryOrder] = useState<string[]>([]);
  const [savingCategoryOrder, setSavingCategoryOrder] = useState(false);

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadMateriales = useCallback(async () => {
    try {
      setLoading(true);
      let data: MaterialAcademico[];

      if (materiaId) {
        data = await materialAcademicoService.getByMateria(parseInt(materiaId));
      } else {
        data = await materialAcademicoService.getAll();
      }

      setMateriales(data);
    } catch (error) {
      console.error('Error al cargar materiales:', error);
      toast.error('Error al cargar los materiales académicos');
    } finally {
      setLoading(false);
    }
  }, [materiaId, toast]);

  useEffect(() => {
    // Solo cargar si Auth.js está inicializado para evitar peticiones sin token
    if (isInitialized && authenticated) {
      loadMateriales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId, isInitialized, authenticated]);

  // Efecto para hacer scroll al material si viene de una referencia
  useEffect(() => {
    if (!loading && materiales.length > 0) {
      const scrollToId = sessionStorage.getItem('scrollToMaterial');
      if (scrollToId) {
        // Limpiar el sessionStorage
        sessionStorage.removeItem('scrollToMaterial');

        // Esperar un poco para que el DOM se renderice completamente
        setTimeout(() => {
          const element = document.getElementById(`material-${scrollToId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Agregar un efecto visual temporal
            element.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
            setTimeout(() => {
              element.classList.remove(
                'ring-4',
                'ring-blue-500',
                'ring-opacity-50'
              );
            }, 2000);
          }
        }, 300);
      }
    }
  }, [loading, materiales]);

  const handleCreate = () => {
    setSelectedMaterial(null);
    setIsModalOpen(true);
  };

  const handleEdit = (material: MaterialAcademico) => {
    setSelectedMaterial(material);
    setIsModalOpen(true);
  };

  const handleDelete = async (material: MaterialAcademico) => {
    const confirmed = await confirm({
      title: 'Eliminar material',
      message: `¿Estás seguro de que deseas eliminar "${material.titulo}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await materialAcademicoService.delete(material.id);
      toast.success('Material eliminado exitosamente');
      loadMateriales();
    } catch (error) {
      console.error('Error al eliminar material:', error);
      toast.error('Error al eliminar el material');
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    const element = categoryRefs.current[categoryName];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getColorClasses = (color?: string) => {
    const colorMap: Record<string, string> = {
      blue: 'from-blue-500 to-cyan-500',
      purple: 'from-blue-500 to-emerald-500',
      green: 'from-green-500 to-emerald-500',
      orange: 'from-orange-500 to-amber-500',
      red: 'from-red-500 to-rose-500',
      pink: 'from-blue-500 to-emerald-500',
      gray: 'from-gray-500 to-slate-500',
    };
    return colorMap[color || 'blue'] || colorMap.blue;
  };

  const groupedMateriales = useMemo(
    () =>
      materiales.reduce(
        (acc, material) => {
          const categoria = material.categoria || 'Sin categoria';
          if (!acc[categoria]) {
            acc[categoria] = [];
          }
          acc[categoria].push(material);
          return acc;
        },
        {} as Record<string, MaterialAcademico[]>
      ),
    [materiales]
  );

  // Preparar categorías para la navegación
  const sortedCategoryEntries = useMemo(
    () =>
      Object.entries(groupedMateriales).sort(
        ([categoryA, itemsA], [categoryB, itemsB]) => {
          const orderA = Math.min(...itemsA.map(item => item.orden ?? 0));
          const orderB = Math.min(...itemsB.map(item => item.orden ?? 0));

          if (orderA !== orderB) return orderA - orderB;
          return categoryA.localeCompare(categoryB);
        }
      ),
    [groupedMateriales]
  );

  const categories = sortedCategoryEntries.map(([name, items]) => {
    // Obtener el color del primer material de la categoría
    const firstMaterial = items[0];
    return {
      name,
      count: items.length,
      color: firstMaterial?.color || 'blue',
    };
  });

  const openCategoryOrderModal = () => {
    setDraftCategoryOrder(categories.map(category => category.name));
    setIsCategoryOrderOpen(true);
  };

  const moveDraftCategory = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= draftCategoryOrder.length) return;

    setDraftCategoryOrder(prev => {
      const next = [...prev];
      const [category] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, category);
      return next;
    });
  };

  const handleDraftCategoryPriorityChange = (
    categoryName: string,
    nextIndex: number
  ) => {
    setDraftCategoryOrder(prev => {
      const currentIndex = prev.indexOf(categoryName);
      if (currentIndex === -1) return prev;

      const next = [...prev];
      const [category] = next.splice(currentIndex, 1);
      next.splice(nextIndex, 0, category);
      return next;
    });
  };

  const saveCategoryOrder = async () => {
    const orderByCategory = new Map(
      draftCategoryOrder.map((category, index) => [category, index])
    );

    const items = materiales.map(material => ({
      id: material.id,
      orden: orderByCategory.get(material.categoria || 'Sin categoria') ?? 0,
    }));

    try {
      setSavingCategoryOrder(true);
      await materialAcademicoService.reorder(items);
      toast.success('Categorías reordenadas exitosamente');
      setIsCategoryOrderOpen(false);
      await loadMateriales();
    } catch (error) {
      console.error('Error al ordenar categorías:', error);
      toast.error('Error al ordenar las categorías');
    } finally {
      setSavingCategoryOrder(false);
    }
  };

  const categoryOrderModal =
    isCategoryOrderOpen &&
    createPortal(
      <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-3 pt-20 sm:p-4 sm:pt-24">
        <div
          className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
          onClick={() => setIsCategoryOrderOpen(false)}
        />
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
                <ListOrdered className="h-5 w-5 text-emerald-500" />
                Ordenar categorías
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                La prioridad 1 se muestra primero en Material Académico.
              </p>
            </div>
            <button
              onClick={() => setIsCategoryOrderOpen(false)}
              className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-950 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4 sm:p-5">
            {draftCategoryOrder.map((categoryName, index) => {
              const category = categories.find(
                item => item.name === categoryName
              );

              return (
                <div
                  key={categoryName}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-sm font-black text-slate-950">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-slate-950 dark:text-white">
                        {categoryName}
                      </p>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {category?.count ?? 0} materiales
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={index}
                      onChange={event =>
                        handleDraftCategoryPriorityChange(
                          categoryName,
                          Number(event.target.value)
                        )
                      }
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      aria-label={`Prioridad de ${categoryName}`}
                    >
                      {draftCategoryOrder.map((_, priorityIndex) => (
                        <option key={priorityIndex} value={priorityIndex}>
                          Prioridad {priorityIndex + 1}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => moveDraftCategory(index, index - 1)}
                      disabled={index === 0}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                      title="Subir categoría"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDraftCategory(index, index + 1)}
                      disabled={index === draftCategoryOrder.length - 1}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                      title="Bajar categoría"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsCategoryOrderOpen(false)}
              disabled={savingCategoryOrder}
              className="w-full rounded-2xl border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={saveCategoryOrder}
              disabled={savingCategoryOrder}
              className="w-full rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-300 dark:text-white sm:w-auto"
            >
              {savingCategoryOrder ? 'Guardando...' : 'Guardar orden'}
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );

  if (loading || loadingCursada) {
    return (
      <LoadingSpinner fullScreen size="lg" label="Cargando materiales..." />
    );
  }

  return (
    <MateriaAccessGuard
      materiaId={parseInt(materiaId || '0')}
      materiaNombre="Materia"
      cursadaId={cursadaId}
    >
      <div className="materia-page-shell material-academico-shell">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        {/* Hero Header */}
        <section className="materia-hero">
          <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="max-w-4xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="materia-chip-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                  <Sparkles className="h-3.5 w-3.5" />
                  Aula digital ITI
                </span>
                <span className="materia-chip-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold">
                  <BookOpen className="h-3.5 w-3.5" />
                  Recursos académicos
                </span>
              </div>
              <h1 className="materia-hero-title max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
                {config.pages.material?.titulo || 'Material Académico'}
              </h1>{' '}
              <p className="materia-hero-description mt-4 max-w-3xl text-lg font-medium leading-8">
                {config.pages.material?.descripcion ||
                  'Recursos, guías y documentación esencial para la cursada'}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
          {canEdit && (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={openCategoryOrderModal}
                disabled={categories.length === 0}
                className="w-full rounded-2xl border-white/20 bg-white/90 px-5 py-3 font-black text-slate-800 shadow-lg shadow-slate-950/10 transition-all hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:text-white sm:w-auto"
              >
                <ListOrdered className="w-5 h-5 mr-2" />
                Ordenar categorías
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                className="w-full rounded-2xl border-none bg-emerald-400 px-5 py-3 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300 sm:w-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Material
              </Button>
            </div>
          )}

          {materiales.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.96] px-6 py-14 text-center shadow-2xl shadow-slate-950/15 dark:bg-slate-900/90">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-2xl font-black text-slate-950 dark:text-white">
                No hay materiales disponibles
              </h3>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                {canEdit
                  ? 'Comienza agregando tu primer material académico.'
                  : 'Aún no se han publicado materiales para esta materia.'}
              </p>
              {canEdit && (
                <Button
                  variant="primary"
                  onClick={handleCreate}
                  className="rounded-2xl border-none bg-emerald-400 px-5 py-3 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Primer Material
                </Button>
              )}
            </div>
          ) : (
            <div className="grid min-w-0 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
              <aside className="min-w-0 self-start lg:sticky lg:top-24 lg:z-20">
                <nav className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.92] p-4 shadow-xl shadow-slate-950/10 backdrop-blur dark:bg-slate-950/55">
                  <div className="mb-4 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-950 dark:text-white">
                        Materiales
                      </h2>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {categories.length} categorías
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[calc(100vh-12rem)] lg:space-y-1 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
                    {categories.map(category => (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => handleCategoryClick(category.name)}
                        className="group flex max-w-[min(18rem,calc(100vw-4rem))] shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-slate-700 transition-all hover:bg-emerald-300 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-emerald-300 dark:hover:text-slate-950 lg:w-full lg:max-w-none"
                      >
                        <span className="min-w-0 truncate">
                          {category.name}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600 transition-all group-hover:bg-slate-950 group-hover:text-white dark:bg-white/10 dark:text-slate-300">
                          {category.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </nav>
              </aside>

              <div className="min-w-0 space-y-8">
                {sortedCategoryEntries.map(([categoria, items]) => (
                  <div
                    key={categoria}
                    ref={el => {
                      categoryRefs.current[categoria] = el;
                    }}
                    id={`categoria-${categoria.toLowerCase().replace(/\s+/g, '-')}`}
                    className="scroll-mt-24"
                  >
                    <div className="mb-4 min-w-0">
                      <h2 className="flex min-w-0 items-start gap-3 text-2xl font-black text-slate-950 dark:text-white sm:items-center">
                        <div className="mt-1 h-6 w-1 shrink-0 rounded-full bg-emerald-300 sm:mt-0"></div>
                        <span className="min-w-0 break-words">{categoria}</span>
                      </h2>
                    </div>

                    <div className="min-w-0 space-y-4">
                      {items.map(material => (
                        <div
                          key={material.id}
                          id={`material-${material.id}`}
                          className="group relative w-full scroll-mt-24 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.96] shadow-xl shadow-slate-950/15 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-2xl dark:bg-slate-900/90"
                        >
                          <div
                            className={`h-2 bg-gradient-to-r ${getColorClasses(
                              material.color
                            )}`}
                          ></div>

                          <div className="p-5">
                            <MaterialRenderer material={material} />

                            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                              {material.tipo === 'link' && material.url && (
                                <a
                                  href={material.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex w-full items-center justify-center gap-2 px-4 py-2.5 sm:flex-1 bg-gradient-to-r ${getColorClasses(
                                    material.color
                                  )} text-white rounded-xl font-medium hover:shadow-sm transform hover:-translate-y-0.5 transition-all`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  {material.textoBoton || 'Ver Recurso'}
                                </a>
                              )}

                              {canEdit && (
                                <div className="flex w-full gap-2 sm:w-auto">
                                  <button
                                    onClick={() => handleEdit(material)}
                                    className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white/90 p-2 text-emerald-700 shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-emerald-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-emerald-200 sm:flex-none"
                                    title="Editar"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(material)}
                                    className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white/90 p-2 text-red-600 shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-red-500 hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-red-200 sm:flex-none"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        <MaterialAcademicoFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMaterial(null);
          }}
          onSuccess={loadMateriales}
          material={selectedMaterial}
          materiaId={materiaId ? parseInt(materiaId) : undefined}
          materiales={materiales}
        />
        {categoryOrderModal}
        <ConfirmDialog {...confirmState} />
      </div>
    </MateriaAccessGuard>
  );
};

export default MaterialAcademicoPage;
