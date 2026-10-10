import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Eye, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import AuthStatus from './AuthStatus';
import { usePermissions } from '../hooks/usePermissions';
import { useMateriaConfig } from '../hooks/useMateriaConfig';
import { PageTransition } from './PageTransition';
import { useStudentPreview } from '../contexts/StudentPreviewContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { canManageCurrentMateria, actualCanManageCurrentMateria } =
    usePermissions();
  const { selection, isPreviewing, stopPreview } = useStudentPreview();

  const getMateriaId = (): string | null => {
    if (id) return id;
    const match = location.pathname.match(/^\/materia\/(\d+)/);
    return match ? match[1] : null;
  };

  const materiaId = getMateriaId();
  const materiaIdNumber = materiaId ? Number(materiaId) : null;
  const canManageStudents = canManageCurrentMateria;
  const { config } = useMateriaConfig(materiaIdNumber);

  const getMateriaRoute = (path: string) => {
    if (materiaId) return `/materia/${materiaId}${path}`;
    return path;
  };

  const isActiveLink = (path: string): boolean => {
    const currentPath = location.pathname;

    if (materiaId) {
      const fullPath =
        path === '/' ? `/materia/${materiaId}` : `/materia/${materiaId}${path}`;
      if (path === '/') return currentPath === fullPath;
      return currentPath.startsWith(fullPath);
    }

    return currentPath === path;
  };

  const handleNavClick = () => {
    setMenuOpen(false);
    setManagementOpen(false);
  };
  const handleMateriaNavClick =
    (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (isActiveLink(path)) event.preventDefault();
      setMenuOpen(false);
      setManagementOpen(false);
    };
  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
    setManagementOpen(false);
  };

  const getLinkClass = (path: string): string => {
    const baseClass =
      'block whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200';

    if (isActiveLink(path)) {
      return `${baseClass} bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/20 dark:text-white`;
    }

    return `${baseClass} text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white`;
  };

  const filterNavItems = <T extends { key: string; visible: boolean }>(
    items: T[]
  ) =>
    items.filter(
      item =>
        item.visible &&
        (item.key === 'configuracion' ||
          config.tabs[item.key as keyof typeof config.tabs] !== false)
    );

  const primaryItems = filterNavItems([
    { key: 'inicio', path: '/', label: 'Inicio', visible: true },
    { key: 'material', path: '/material', label: 'Material', visible: true },
    { key: 'videos', path: '/videos', label: 'Videos', visible: true },
    { key: 'semanas', path: '/semanas', label: 'Semanas', visible: true },
    {
      key: 'cronograma',
      path: '/cronograma',
      label: config.pages.cronograma?.titulo || 'Cronograma',
      visible: true,
    },
    {
      key: 'misAlumnos',
      path: '/mis-alumnos',
      label: 'Mis alumnos',
      visible: canManageStudents,
    },
    {
      key: 'planilla',
      path: '/planilla-seguimiento',
      label: 'Planilla',
      // La planilla contiene datos personales, no datos de una comisión.
      visible: !isPreviewing,
    },
    {
      key: 'contratoPedagogico',
      path: '/contrato-pedagogico',
      label: 'Contrato pedagogico',
      visible: true,
    },
  ]);
  const primaryItemKeys = new Set(primaryItems.map(item => item.key));

  const managementItems = filterNavItems([
    {
      key: 'contratoPedagogico',
      path: '/contrato-pedagogico',
      label: 'Contrato pedagógico',
      visible: true,
    },
    { key: 'logs', path: '/logs', label: 'Logs', visible: canManageStudents },
    {
      key: 'papelera',
      path: '/papelera',
      label: 'Papelera',
      visible: canManageStudents,
    },
    {
      key: 'gitea',
      path: '/gitea',
      label: 'Gitea',
      visible: canManageStudents,
    },
    {
      key: 'configuracion',
      path: '/configuracion',
      label: 'Configuración',
      visible: canManageStudents,
    },
  ]).filter(item => !primaryItemKeys.has(item.key));

  const isManagementActive = managementItems.some(item =>
    isActiveLink(item.path)
  );

  const getManagementButtonClass = (): string => {
    const baseClass =
      'flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200';

    if (isManagementActive) {
      return `${baseClass} bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/20 dark:text-white`;
    }

    return `${baseClass} text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white`;
  };

  const renderNavLink = (item: {
    key: string;
    path: string;
    label: string;
  }) => (
    <Link
      key={item.key}
      to={getMateriaRoute(item.path === '/' ? '' : item.path)}
      className={getLinkClass(item.path)}
      aria-current={isActiveLink(item.path) ? 'page' : undefined}
      onClick={handleMateriaNavClick(item.path)}
    >
      {item.label}
    </Link>
  );

  const renderMobileSection = (
    title: string,
    items: Array<{ key: string; path: string; label: string }>
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1">
        <p className="px-3 pt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {items.map(item => (
          <li key={item.key}>{renderNavLink(item)}</li>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 text-slate-950 shadow-lg shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 dark:text-white dark:shadow-slate-950/20">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link
              to="/"
              className="group flex flex-shrink-0 items-center gap-2.5 rounded-xl"
              aria-label="Ir al inicio"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm shadow-emerald-950/10 transition group-hover:border-emerald-300 dark:border-white/15 dark:shadow-emerald-950/20">
                <img
                  src="/images/LOGO.png"
                  alt="Logo UNAHUR"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="self-center whitespace-nowrap text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
                UNAHUR
              </span>
            </Link>

            <ul className="hidden min-w-0 flex-1 items-center justify-center gap-1 font-medium xl:flex">
              {materiaId && (
                <li>
                  <Link
                    to="/materias"
                    className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Materias
                  </Link>
                </li>
              )}
              {materiaId &&
                primaryItems.map(item => (
                  <li key={item.key}>{renderNavLink(item)}</li>
                ))}
              {materiaId && managementItems.length > 0 && (
                <li className="relative">
                  <button
                    type="button"
                    className={getManagementButtonClass()}
                    aria-expanded={managementOpen}
                    onClick={() => setManagementOpen(prev => !prev)}
                  >
                    Gestion
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${managementOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {managementOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-30 cursor-default"
                        aria-label="Cerrar menu de gestion"
                        onClick={() => setManagementOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-40 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900 dark:shadow-slate-950/40">
                        {managementItems.map(item => renderNavLink(item))}
                      </div>
                    </>
                  )}
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="hidden xl:block">
              <AuthStatus alwaysShow={true} />
            </div>
            <ThemeToggle />

            <button
              type="button"
              className="inline-flex items-center rounded-xl border border-slate-200 p-2 text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10 xl:hidden"
              aria-controls="navbar-default"
              aria-expanded={menuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">
                {menuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
              </span>
              {menuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          <div
            className={`${menuOpen ? 'block' : 'hidden'} absolute left-0 right-0 top-full z-40 max-h-[calc(100dvh-4.25rem)] w-full overflow-y-auto border-t border-slate-200 bg-white/95 px-4 pb-4 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 dark:shadow-slate-950/35 xl:hidden`}
            id="navbar-default"
          >
            <ul className="mt-4 flex flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4 font-medium dark:border-white/10 dark:bg-white/5">
              {materiaId && (
                <li>
                  <Link
                    to="/materias"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                    onClick={handleNavClick}
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Materias
                  </Link>
                </li>
              )}
              {materiaId && renderMobileSection('Materia', primaryItems)}
              {materiaId && renderMobileSection('Gestion', managementItems)}
            </ul>
            <div className="border-t border-slate-200 pt-4 dark:border-white/10">
              <AuthStatus alwaysShow={true} inlineDropdown={true} />
            </div>
          </div>
        </div>
      </nav>

      {materiaIdNumber && actualCanManageCurrentMateria && isPreviewing && (
        <section
          className="border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-100 sm:px-6 lg:px-8"
          aria-label="Vista como alumno"
        >
          <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Eye className="h-4 w-4" aria-hidden="true" />
              {`Vista como alumno: ${selection?.comisionNombre}`}
            </div>
            <button
              type="button"
              onClick={stopPreview}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-sm font-black text-amber-950 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-amber-900/50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Salir de la vista de alumno
            </button>
          </div>
        </section>
      )}

      <main className="flex-1">
        <PageTransition key={location.pathname}>{children}</PageTransition>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white/85 text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link to="/" className="flex items-center">
              <span className="whitespace-nowrap text-2xl font-black text-slate-950 dark:text-white">
                UNAHUR
              </span>
            </Link>

            <span className="text-center text-sm text-slate-500 dark:text-slate-400">
              © 2026{' '}
              <Link to="/" className="hover:underline">
                UNAHUR
              </Link>
              . Proyecto Materiales Tecnológicos - Universidad Nacional de
              Hurlingham
            </span>

            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              {materiaId && (
                <>
                  <Link
                    to={getMateriaRoute('/material')}
                    className="transition-colors hover:text-emerald-700 hover:underline dark:hover:text-emerald-300"
                  >
                    Material
                  </Link>
                  <Link
                    to={getMateriaRoute('/videos')}
                    className="transition-colors hover:text-emerald-700 hover:underline dark:hover:text-emerald-300"
                  >
                    Videos
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
