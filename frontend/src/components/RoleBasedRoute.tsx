import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../app/auth/contexts/AuthContext';

/**
 * Props para el componente RoleBasedRoute
 */
interface RoleBasedRouteProps {
  children: React.ReactElement;
  requiredRoles: string[];
  redirectTo?: string;
}

/**
 * Componente para proteger rutas que requieren roles específicos
 * Si el usuario no tiene ninguno de los roles requeridos, redirige o muestra mensaje
 *
 * @example
 * <RoleBasedRoute requiredRoles={['docente', 'alumno']}>
 *   <HomePage />
 * </RoleBasedRoute>
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requiredRoles,
  redirectTo,
}) => {
  const { auth, authenticated, userInfo } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Efecto para manejar el login solo una vez
  useEffect(() => {
    if (auth && !authenticated && !isRedirecting) {
      setIsRedirecting(true);
      auth.login(`${window.location.pathname}${window.location.search}`);
    }
  }, [auth, authenticated, isRedirecting]);

  // Mostrar loading mientras Auth.js se inicializa
  if (!auth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Iniciando autenticación...
          </p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar loading mientras redirige
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Redirigiendo al login...
          </p>
        </div>
      </div>
    );
  }

  // Verificar si el usuario tiene alguno de los roles requeridos
  const hasRequiredRole = requiredRoles.some(role =>
    userInfo?.roles.includes(role)
  );

  // Si no tiene ninguno de los roles requeridos
  if (!hasRequiredRole) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Acceso No Autorizado
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No tienes los permisos necesarios para acceder a esta página.
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Se requiere uno de los siguientes roles: {requiredRoles.join(', ')}
          </p>
          <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            <p>
              <strong>Usuario:</strong> {userInfo?.username || 'Desconocido'}
            </p>
            <p>
              <strong>Roles asignados:</strong>{' '}
              {userInfo?.roles.join(', ') || 'Ninguno'}
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() =>
                auth.logout({ redirectUri: window.location.origin })
              }
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si tiene el rol requerido, mostrar el contenido
  return children;
};

export default RoleBasedRoute;
