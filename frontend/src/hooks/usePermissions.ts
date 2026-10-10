import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../app/auth/contexts/AuthContext';
import { usuarioService } from '../services/usuario.service';
import { useStudentPreview } from '../contexts/StudentPreviewContext';

let materiasProfesorCache: number[] | null = null;
let materiasProfesorPromise: Promise<number[]> | null = null;

const getMateriasProfesorIds = async () => {
  if (materiasProfesorCache) return materiasProfesorCache;

  if (!materiasProfesorPromise) {
    materiasProfesorPromise = usuarioService
      .obtenerMateriasProfesor()
      .then(materias => {
        materiasProfesorCache = materias
          .map((pm: any) => pm.materia?.id)
          .filter(Boolean);
        return materiasProfesorCache;
      })
      .finally(() => {
        materiasProfesorPromise = null;
      });
  }

  return materiasProfesorPromise;
};

/**
 * Hook para manejar permisos de usuario
 * Determina si el usuario es docente, alumno, o tiene permisos de edición
 */
export const usePermissions = () => {
  const { userInfo, hasRole, hasAnyRole, authenticated } = useAuth();
  const { selection } = useStudentPreview();
  const location = useLocation();
  const [materiasProfesorIds, setMateriasProfesorIds] = useState<number[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(
    authenticated && !hasRole('admin') && hasRole('docente')
  );

  const materiaId = useMemo(() => {
    const match = location.pathname.match(/^\/materia\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [location.pathname]);

  const isAdmin = hasRole('admin');
  const isGlobalDocente = hasRole('docente');

  useEffect(() => {
    let cancelled = false;

    async function loadMateriasProfesor() {
      if (!authenticated || isAdmin || !isGlobalDocente) {
        materiasProfesorCache = null;
        setMateriasProfesorIds([]);
        setLoadingPermissions(false);
        return;
      }

      setLoadingPermissions(true);
      try {
        const materiaIds = await getMateriasProfesorIds();
        if (!cancelled) {
          setMateriasProfesorIds(materiaIds);
        }
      } catch {
        if (!cancelled) setMateriasProfesorIds([]);
      } finally {
        if (!cancelled) setLoadingPermissions(false);
      }
    }

    loadMateriasProfesor();

    return () => {
      cancelled = true;
    };
  }, [authenticated, isAdmin, isGlobalDocente]);

  const isMateriaProfesor =
    materiaId !== null && materiasProfesorIds.includes(materiaId);
  const actualCanManageCurrentMateria = isAdmin || isMateriaProfesor;
  const isPreviewingAsStudent = Boolean(
    selection &&
    selection.materiaId === materiaId &&
    actualCanManageCurrentMateria
  );
  const isDocente = isMateriaProfesor && !isPreviewingAsStudent;
  const canManageCurrentMateria =
    actualCanManageCurrentMateria && !isPreviewingAsStudent;

  return {
    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated: authenticated,

    /**
     * Verifica si el usuario tiene rol de docente
     */
    isDocente,

    /**
     * Verifica si el usuario tiene rol de alumno
     */
    isAlumno: authenticated && !canManageCurrentMateria,

    /**
     * Alias para isDocente (para consistencia)
     */
    isProfesor: isDocente,

    /**
     * Verifica si el usuario puede editar contenido
     * (docentes y admins pueden editar)
     */
    canEdit: canManageCurrentMateria,

    /**
     * Verifica si el usuario puede eliminar contenido
     * (docentes y admins pueden eliminar)
     */
    canDelete: canManageCurrentMateria,

    /**
     * Verifica si el usuario puede crear contenido
     * (docentes y admins pueden crear)
     */
    canCreate: canManageCurrentMateria,

    isAdmin: isAdmin && !isPreviewingAsStudent,
    actualIsAdmin: isAdmin,
    isGlobalDocente,
    isMateriaProfesor,
    canManageCurrentMateria,
    actualCanManageCurrentMateria,
    isPreviewingAsStudent,
    loadingPermissions,

    /**
     * Información del usuario actual
     */
    userInfo,

    /**
     * Función para verificar un rol específico
     */
    hasRole,

    /**
     * Función para verificar si tiene alguno de los roles especificados
     */
    hasAnyRole,
  };
};

export default usePermissions;
