import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../app/auth/contexts/AuthContext';

import { Link, useLocation } from 'react-router-dom';
import { usuarioService } from '../services/usuario.service';
import { usePermissions } from '../hooks/usePermissions';

import { apiService } from '../shared/services/api.service';
import { StudentPreviewMenu } from './StudentPreviewMenu';

interface AuthStatusProps {
  alwaysShow?: boolean;
  /** Estilo compacto para espacios reducidos */
  compact?: boolean;
  /** Evita posicionamiento flotante cuando se usa dentro del menú móvil */
  inlineDropdown?: boolean;
}

/**
 * Componente de autenticación *
 * Estados:
 * - No autenticado: Botón "Acceso docente" con ícono
 * - Autenticado: Dropdown con avatar, nombre de usuario y menú
 * - Cargando: Spinner
 */
const AuthStatus: React.FC<AuthStatusProps> = ({
  alwaysShow = false,
  compact = false,
  inlineDropdown = false,
}) => {
  const { authenticated, auth, userInfo, login, logout } = useAuth();
  const { isAdmin, isMateriaProfesor } = usePermissions();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [contextInfo, setContextInfo] = useState<{
    materia?: string;
    comision?: string;
  } | null>(null);
  const materiaMatch = location.pathname.match(/\/materia\/(\d+)/);
  const currentMateriaId = materiaMatch?.[1];
  const canSeeMyExercises =
    authenticated && userInfo?.roles.includes('alumno') && currentMateriaId;

  const displayRole = isAdmin
    ? 'Administrador'
    : isMateriaProfesor
      ? 'Profesor'
      : authenticated
        ? 'Alumno'
        : 'Usuario';

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Cargar contexto de materia/comisión basado en la URL
  useEffect(() => {
    const loadContextInfo = async () => {
      const match = location.pathname.match(/\/materia\/(\d+)/);
      if (match && match[1] && authenticated && userInfo) {
        const materiaId = parseInt(match[1]);
        let contextFound = false;

        try {
          // 1. Prioridad: asignacion como profesor en la materia actual.
          try {
            const materias = await usuarioService.obtenerMateriasProfesor();
            const materiaActual = materias.find(
              (pm: any) => pm.materia.id === materiaId
            );

            if (materiaActual) {
              const comisiones = materiaActual.comisiones
                ?.map((c: any) => c.comision.nombre)
                .join(', ');
              setContextInfo({
                materia: materiaActual.materia.nombre,
                comision: comisiones || 'Acceso completo a la materia',
              });
              contextFound = true;
            }
          } catch (err) {
            console.error('Error checking teacher context:', err);
          }

          // 2. Si no se encontró como docente, intentar como Alumno
          if (!contextFound && userInfo.roles.includes('alumno')) {
            try {
              const estado =
                await usuarioService.verificarEstadoInscripcion(materiaId);
              if (estado.estado === 'aprobado' && estado.inscripcion) {
                setContextInfo({
                  materia: estado.inscripcion.materia?.nombre,
                  comision: estado.inscripcion.comision?.nombre,
                });
                contextFound = true;
              }
            } catch (err) {
              console.error('Error checking student context:', err);
            }
          }

          // 3. Si es Admin (y no se encontró contexto específico o queremos mostrar info genérica)
          // Si ya se encontró contexto (ej. es docente de la materia), mantenemos ese porque es más rico (muestra comisiones)
          // Pero si es admin y no es docente de la materia, mostramos la info genérica
          if (!contextFound && userInfo.roles.includes('admin')) {
            try {
              const materia: any = await apiService.get(
                `/materia/${materiaId}`
              );
              if (materia) {
                setContextInfo({
                  materia: materia.nombre,
                  comision: 'Vista de Administrador',
                });
                contextFound = true;
              }
            } catch (err) {
              console.error('Error checking admin context:', err);
            }
          }

          // 4. Fallback para Docentes no asignados (ver materia sin estar asignado)
          if (!contextFound && userInfo.roles.includes('docente')) {
            try {
              const materia: any = await apiService.get(
                `/materia/${materiaId}`
              );
              if (materia) {
                setContextInfo({
                  materia: materia.nombre,
                  comision: 'Vista Docente (No asignado)',
                });
              }
            } catch {
              // Ignore
            }
          }
        } catch (error) {
          console.error('Error loading context info:', error);
          setContextInfo(null);
        }
      } else {
        setContextInfo(null);
      }
    };

    loadContextInfo();
  }, [location.pathname, authenticated, userInfo]);

  // Estado de carga
  if (!auth) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin dark:border-gray-600 dark:border-t-primary-400"></div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Cargando...
        </span>
      </div>
    );
  }

  // No mostrar si no es alwaysShow y no está autenticado
  if (!alwaysShow && !authenticated) return null;

  return (
    <div
      className={`${inlineDropdown ? 'w-full' : 'relative'}`}
      ref={dropdownRef}
    >
      {authenticated ? (
        // Usuario autenticado - Dropdown
        <>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`${inlineDropdown ? 'w-full justify-between' : ''} flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-all duration-200`}
            type="button"
          >
            {/* Avatar con indicador de estado activo */}
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {(userInfo?.name ||
                  userInfo?.given_name ||
                  userInfo?.username ||
                  'U')[0].toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full dark:border-gray-800"></div>
            </div>

            {/* Información del usuario */}
            <div
              className={`${compact ? 'hidden sm:flex' : 'flex'} min-w-0 flex-1 flex-col items-start`}
            >
              <span className="text-xs font-medium truncate max-w-[100px]">
                {userInfo?.name ||
                  userInfo?.given_name ||
                  userInfo?.username ||
                  'Usuario'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {displayRole}
              </span>
            </div>

            {/* Flecha indicadora */}
            <svg
              className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Menú desplegable */}
          {isDropdownOpen && (
            <div
              className={`${inlineDropdown ? 'relative left-0 right-auto w-full max-w-full' : 'absolute right-0 w-64'} z-50 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:divide-gray-600 dark:border-gray-700 animate-fade-in`}
            >
              {/* Información del usuario */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                    {(userInfo?.name ||
                      userInfo?.given_name ||
                      userInfo?.username ||
                      'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {userInfo?.name ||
                        userInfo?.given_name ||
                        userInfo?.username ||
                        'Usuario'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {displayRole}
                    </div>
                  </div>
                </div>

                {/* Contexto de Materia/Comisión */}
                {contextInfo && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Contexto Actual
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                      <div
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate"
                        title={contextInfo.materia}
                      >
                        {contextInfo.materia}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="truncate" title={contextInfo.comision}>
                          {contextInfo.comision}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Opciones del menú */}
              <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                <StudentPreviewMenu
                  open={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                />
                {canSeeMyExercises && (
                  <li>
                    <Link
                      to={`/materia/${currentMateriaId}/mis-ejercicios`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 3v12m0 0a3 3 0 100 6 3 3 0 000-6zm0 0h8a4 4 0 004-4V9m0 0a3 3 0 100-6 3 3 0 000 6z"
                        />
                      </svg>
                      Mis ejercicios
                    </Link>
                  </li>
                )}
                {isAdmin && (
                  <>
                    <li>
                      <Link
                        to="/admin/usuarios"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8z"
                          />
                        </svg>
                        Usuarios
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/solicitudes"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Solicitudes
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/reportes"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        Reportes
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white transition-colors duration-200 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          )}
        </>
      ) : (
        // Usuario no autenticado
        <button
          onClick={() => login()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-primary-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-all duration-200"
        >
          {/* Ícono de usuario */}
          <div className="w-6 h-6 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center dark:bg-gray-700 dark:border-gray-600">
            <svg
              className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          {/* Texto del botón */}
          <span
            className={`${compact ? 'hidden sm:inline' : ''} text-gray-700 dark:text-gray-300`}
          >
            Acceso
          </span>

          {/* Ícono de ingreso */}
          <svg
            className="w-4 h-4 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AuthStatus;
