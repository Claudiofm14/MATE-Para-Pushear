import React from 'react';
import { useAuth } from '../app/auth/contexts/AuthContext';

/**
 * Props para el componente PublicRoute
 */
interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Componente para rutas públicas accesibles por alumnos y docentes
 * Cada componente hijo maneja su propia lógica de edición según el rol del usuario
 *
 * @example
 * <PublicRoute>
 *   <WelcomeCard editable={isDocente} />
 *   <NoticeCard editable={isDocente} />
 * </PublicRoute>
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const { auth } = useAuth();

  // Mostrar loading mientras Auth.js se inicializa
  if (!auth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Renderizar contenido directamente - cada componente maneja su propia edición
  return <>{children}</>;
};

export default PublicRoute;
