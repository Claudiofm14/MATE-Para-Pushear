import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para verificar roles del usuario
 * Proporciona métodos específicos para los roles de la Materiales Tecnológicos - Universidad Nacional de Hurlingham
 *
 * @returns Objeto con verificadores de roles específicos
 *
 * @example
 * const MyComponent = () => {
 *   const { isAlumno, isDocente, canEdit } = useRoles();
 *
 *   return (
 *     <div>
 *       {isDocente && <EditButton />}
 *       {canEdit && <AdminPanel />}
 *     </div>
 *   );
 * };
 */
export const useRoles = () => {
  const { userInfo, hasRole, hasAnyRole } = useAuth();

  /**
   * Verifica si el usuario es alumno
   */
  const isAlumno = hasRole('alumno');

  /**
   * Verifica si el usuario es docente
   */
  const isDocente = hasRole('docente');

  /**
   * Obtiene todos los roles del usuario
   */
  const userRoles = userInfo?.roles || [];

  /**
   * Verifica si el usuario puede editar contenido
   * (Solo docentes por ahora, basado en los roles reales de Auth.js)
   */
  const canEdit = isDocente;

  return {
    // Métodos del contexto
    hasRole,
    hasAnyRole,
    userRoles,

    // Verificadores específicos para roles reales
    isAlumno,
    isDocente,
    canEdit,
  };
};
