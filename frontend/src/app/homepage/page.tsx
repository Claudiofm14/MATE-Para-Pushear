import React from 'react';
import { useAuth } from '../auth/contexts/AuthContext';
import { useHomePageData } from '../../modules/homepage/hooks/useHomePageData';
import { HeroSectionComponent } from '../../components/HeroSectionComponent';
import { WelcomeSectionComponent } from '../../components/WelcomeSectionComponent';
import { ImportantNoticeSectionComponent } from '../../components/ImportantNoticeSectionComponent';
import { CommunicationChannelsSectionComponent } from '../../components/CommunicationChannelsSectionComponent';
import { QuickLinksSectionComponent } from '../../components/QuickLinksSectionComponent';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorComponent } from '../../components/ErrorComponent';
import { ImportGiteaStudentsModal } from '../../components/admin/ImportGiteaStudentsModal';
import { FileSpreadsheet } from 'lucide-react';

/**
 * Página principal de la aplicación
 * Muestra las secciones principales de la homepage
 */
export function HomePage() {
  const { authenticated, userInfo, hasAnyRole, login, auth } = useAuth();
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const hasRequiredRole = hasAnyRole(['admin', 'docente', 'alumno']);
  const isAdmin = hasAnyRole(['admin']);
  const { data, loading, error, refetch } = useHomePageData();

  // Mostrar loading mientras Auth.js se inicializa
  if (!auth) {
    return <LoadingSpinner fullScreen size="lg" label="Inicializando..." />;
  }

  // Si no está autenticado, mostrar página de bienvenida
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Bienvenido a Materiales Tecnológicos - Universidad Nacional de
              Hurlingham
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Inicia sesión para acceder a los contenidos de la materia
            </p>
            <button
              onClick={() => login()}
              className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si está autenticado pero no tiene los roles requeridos
  if (!hasRequiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Acceso No Autorizado
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No tienes los permisos necesarios. Se requiere rol de docente o
            alumno.
          </p>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            <p>
              <strong>Usuario:</strong> {userInfo?.username}
            </p>
            <p>
              <strong>Roles:</strong> {userInfo?.roles.join(', ') || 'Ninguno'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Usuario autenticado con roles correctos - cargar contenido

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" label="Cargando inicio..." />;
  }

  if (error) {
    return <ErrorComponent error={error} onRetry={refetch} />;
  }

  if (!data) {
    return (
      <ErrorComponent
        error="No se pudieron cargar los datos de la página"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <HeroSectionComponent hero={data.hero} />

      {isAdmin && (
        <section className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex max-w-6xl justify-end">
            <button
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              type="button"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Importar alumnos a Gitea
            </button>
          </div>
        </section>
      )}

      {/* Welcome Section */}
      <WelcomeSectionComponent welcome={data.welcome} />

      {/* Important Notice Section */}
      <ImportantNoticeSectionComponent importantNotice={data.importantNotice} />

      {/* Communication Channels Section */}
      <CommunicationChannelsSectionComponent
        communicationChannels={data.communicationChannels}
      />

      {/* Quick Links Section */}
      <QuickLinksSectionComponent quickLinks={data.quickLinks} />

      <ImportGiteaStudentsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
}
