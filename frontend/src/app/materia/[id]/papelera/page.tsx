import React, { useEffect, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '../../../../shared/design-system/components/Button';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { useToast } from '../../../../hooks';
import { TrashItem, trashService } from '../../../../services/trash.service';

const typeLabels: Record<TrashItem['type'], string> = {
  cursada: 'Cursada',
  semana: 'Semana',
  video: 'Video',
  ejercicio: 'Ejercicio',
};

const PapeleraPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const materiaId = Number(id);
  const toast = useToast();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      setItems(await trashService.list(materiaId));
    } catch (error) {
      console.error('Error cargando papelera:', error);
      toast.error('No se pudo cargar la papelera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (materiaId) loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId]);

  const handleRestore = async (item: TrashItem) => {
    const key = `${item.type}-${item.id}`;
    try {
      setRestoring(key);
      await trashService.restore(materiaId, item.type, item.id);
      toast.success('Elemento restaurado');
      await loadItems();
    } catch (error) {
      console.error('Error restaurando elemento:', error);
      toast.error('No se pudo restaurar el elemento');
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" label="Cargando papelera..." />;
  }

  return (
    <div className="app-page">
      <div className="app-page-container max-w-5xl">
        <header className="mb-6">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-300/10 dark:text-red-200">
            <Trash2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">
            Papelera
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Elementos eliminados que todavia pueden restaurarse.
          </p>
        </header>

        {items.length === 0 ? (
          <div className="app-empty-state">
            No hay elementos en la papelera.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const key = `${item.type}-${item.id}`;
              return (
                <article
                  key={key}
                  className="app-surface-interactive flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <span className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-white/10 dark:text-slate-200">
                      {typeLabels[item.type]}
                    </span>
                    <h2 className="font-black text-slate-950 dark:text-white">
                      {item.title}
                    </h2>
                    {item.detail && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {item.detail}
                      </p>
                    )}
                    {item.deletedAt && (
                      <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Eliminado: {new Date(item.deletedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    disabled={restoring === key}
                    onClick={() => handleRestore(item)}
                    className="w-full rounded-2xl sm:w-auto"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {restoring === key ? 'Restaurando...' : 'Restaurar'}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PapeleraPage;
