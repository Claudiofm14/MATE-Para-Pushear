import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, EyeOff, Save, Settings } from 'lucide-react';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { Button } from '../../../../shared/design-system/components/Button';
import { useMateriaConfig, usePermissions, useToast } from '../../../../hooks';
import {
  MateriaConfig,
  MateriaTabKey,
  materiaConfigService,
} from '../../../../services/materia-config.service';

// ✅ CAMBIO 1: Se agregó la pestaña 'contratoPedagogico' a este array (línea agregada: 48-51)
const editableTabs: Array<{
  key: MateriaTabKey;
  label: string;
  description: string;
}> = [
  {
    key: 'inicio',
    label: 'Inicio',
    description: 'Página principal de la materia.',
  },
  {
    key: 'material',
    label: 'Material',
    description: 'Material académico general.',
  },
  {
    key: 'videos',
    label: 'Videos',
    description: 'Videotutoriales y recursos audiovisuales.',
  },
  {
    key: 'semanas',
    label: 'Semanas',
    description: 'Contenido organizado por semanas.',
  },
  {
    key: 'cronograma',
    label: 'Cronograma',
    description: 'Clases y actividades de la cursada en formato tabular.',
  },
  {
    key: 'avance',
    label: 'Avance de Cursada',
    description: 'Mapa de actividades, entregas y progreso personal.',
  },
  {
    key: 'misAlumnos',
    label: 'Mis Alumnos',
    description: 'Gestión de solicitudes y estudiantes.',
  },
  {
    key: 'planilla',
    label: 'Planilla de Seguimiento',
    description: 'Actividades, entregas y seguimiento.',
  },
  // ✅ NUEVA LÍNEA - CAMBIO 1 START
  {
    key: 'contratoPedagogico',
    label: 'Contrato Pedagógico',
    description: 'Términos y condiciones académicas del curso.',
  },
  // ✅ NUEVA LÍNEA - CAMBIO 1 END
  {
    key: 'logs',
    label: 'Logs',
    description: 'Auditoría visible solo para profe/admin.',
  },
];

// ✅ CAMBIO 2: Se agregó 'contratoPedagogico' a este array (línea agregada: 73)
const headerPages = [
  { key: 'material', label: 'Material' },
  { key: 'videos', label: 'Videos' },
  { key: 'semanas', label: 'Semanas' },
  { key: 'cronograma', label: 'Cronograma' },
  { key: 'avance', label: 'Avance de Cursada' },
  { key: 'misAlumnos', label: 'Mis Alumnos' },
  { key: 'planilla', label: 'Planilla de Seguimiento' },
  // ✅ NUEVA LÍNEA - CAMBIO 2
  { key: 'contratoPedagogico', label: 'Contrato Pedagógico' },
];

const MateriaConfiguracionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const materiaId = Number(id);
  const { canManageCurrentMateria } = usePermissions();
  const toast = useToast();
  const { config, loading, setConfig, refetch } = useMateriaConfig(materiaId);
  const [draft, setDraft] = useState<MateriaConfig>(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const setTab = (key: MateriaTabKey, value: boolean) => {
    setDraft(prev => ({
      ...prev,
      tabs: { ...prev.tabs, [key]: value },
    }));
  };

  const setPageField = (
    pageKey: string,
    field: 'titulo' | 'descripcion',
    value: string
  ) => {
    setDraft(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: {
          ...(prev.pages[pageKey] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!materiaId) return;
    setSaving(true);
    try {
      const updated = await materiaConfigService.updateConfig(materiaId, {
        ...draft,
        tabs: {
          ...draft.tabs,
          configuracion: true,
        },
      });
      setConfig(updated);
      toast.success('Configuración actualizada');
      refetch();
    } catch (error: any) {
      console.error('Error al guardar configuracion:', error);
      toast.error(
        error.response?.data?.message || 'Error al guardar la configuración'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canManageCurrentMateria) {
    return (
      <div className="materia-page-shell flex items-center justify-center p-6">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        <div className="relative z-10 max-w-xl rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900/90">
          <Settings className="mx-auto mb-4 h-14 w-14 text-slate-400" />
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">
            No tenés acceso a esta configuración
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            Solo profesores de la materia y administradores pueden modificarla.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="materia-page-shell flex items-center justify-center">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="materia-page-shell">
      <div className="materia-page-gradient" />
      <div className="materia-page-grid" />
      <section className="materia-hero">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <Settings className="w-6 h-6" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Configuración
              </span>
            </div>
            <h1 className="materia-hero-title text-3xl font-black tracking-tight">
              Configuración de materia
            </h1>
            <p className="materia-hero-description max-w-3xl text-sm font-medium leading-6 sm:text-base">
              Definí qué solapas aparecen en la materia y personalizá los
              títulos y descripciones de cada página.
            </p>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
        <section className="app-surface p-4 sm:p-6">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Solapas visibles
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {editableTabs.map(tab => {
              const enabled = draft.tabs[tab.key] !== false;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTab(tab.key, !enabled)}
                  className={`flex min-w-0 items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    enabled
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60'
                  }`}
                >
                  {enabled ? (
                    <Eye className="mt-0.5 w-5 h-5 text-blue-600 dark:text-blue-300" />
                  ) : (
                    <EyeOff className="mt-0.5 w-5 h-5 text-gray-500" />
                  )}
                  <span className="min-w-0">
                    <span className="block font-semibold text-gray-900 dark:text-white">
                      {tab.label}
                    </span>
                    <span className="mt-1 block break-words text-sm text-gray-600 dark:text-gray-400">
                      {tab.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="app-surface p-4 sm:p-6">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Títulos y descripciones
          </h2>
          <div className="mt-5 space-y-5">
            {headerPages.map(page => (
              <div
                key={page.key}
                className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-5 first:border-t-0 first:pt-0 dark:border-slate-700"
              >
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  {page.label}
                </h3>
                <input
                  value={draft.pages[page.key]?.titulo || ''}
                  onChange={e =>
                    setPageField(page.key, 'titulo', e.target.value)
                  }
                  className="app-form-control"
                  placeholder="Título"
                />
                <textarea
                  value={draft.pages[page.key]?.descripcion || ''}
                  onChange={e =>
                    setPageField(page.key, 'descripcion', e.target.value)
                  }
                  rows={2}
                  className="app-form-control resize-y"
                  placeholder="Descripción"
                />
              </div>
            ))}
          </div>
        </section>

        <div className="sticky bottom-4 z-20 flex justify-stretch rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/90 sm:justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            className="w-full justify-center shadow-lg sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MateriaConfiguracionPage;
