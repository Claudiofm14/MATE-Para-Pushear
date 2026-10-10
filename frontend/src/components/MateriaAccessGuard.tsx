import React, { useState, useEffect } from 'react';
import { useAuth } from '../app/auth/contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useEstadoInscripcion } from '../hooks/useInscripcion';
import { InscripcionModal } from './InscripcionModal';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from '../shared/design-system/components/Button';
import { Card } from '../shared/design-system/components/Card';

export interface MateriaAccessGuardProps {
  materiaId: number;
  materiaNombre: string;
  cursadaId: number;
  children: React.ReactNode;
  onAccessGranted?: () => void;
}

/**
 * Componente que verifica el estado de inscripción del alumno
 * y muestra el contenido apropiado según el estado
 */
export const MateriaAccessGuard: React.FC<MateriaAccessGuardProps> = ({
  materiaId,
  materiaNombre,
  cursadaId,
  children,
  onAccessGranted,
}) => {
  const { auth } = useAuth();
  const {
    isDocente,
    isAdmin,
    isAuthenticated,
    loadingPermissions,
    isPreviewingAsStudent,
  } = usePermissions();
  const shouldCheckInscripcion =
    isAuthenticated && !loadingPermissions && !isDocente && !isAdmin;

  const { estado, loading, refetch } = useEstadoInscripcion(
    shouldCheckInscripcion ? materiaId : null,
    cursadaId
  );
  const [showModal, setShowModal] = useState(false);

  // Hook debe estar antes de cualquier return condicional
  useEffect(() => {
    if (estado?.estado === 'aprobado' && onAccessGranted) {
      onAccessGranted();
    }
  }, [estado?.estado, onAccessGranted]);

  if (loadingPermissions) {
    return <LoadingSpinner />;
  }

  // Si es docente o admin, permitir acceso directo
  if (isDocente || isAdmin || isPreviewingAsStudent) {
    return <>{children}</>;
  }

  // Si no es alumno, no mostrar nada (no debería llegar aquí)
  if (!auth) {
    return null;
  }

  // Mostrar loading mientras verifica
  if (loading) {
    return <LoadingSpinner />;
  }

  // Si está aprobado, mostrar contenido
  if (estado?.estado === 'aprobado') {
    return <>{children}</>;
  }

  // Si está pendiente, mostrar mensaje
  if (estado?.estado === 'pendiente') {
    return (
      <div className="app-page flex items-center justify-center">
        <Card className="w-full max-w-2xl px-5 py-10 text-center sm:px-8 sm:py-12">
          {/* Icono de reloj */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 sm:h-24 sm:w-24">
            <svg
              className="w-12 h-12 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Título */}
          <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
            Solicitud Pendiente
          </h1>

          {/* Mensaje */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Tu solicitud de inscripción a <strong>{materiaNombre}</strong> está
            siendo revisada por el profesor.
          </p>

          {/* Información adicional */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Recibirás una notificación cuando tu solicitud sea aprobada.
              Mientras tanto, puedes explorar otras materias.
            </p>
          </div>

          {/* Comisión seleccionada */}
          {estado?.inscripcion?.comision && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Comisión solicitada:{' '}
              <strong>{estado.inscripcion.comision.nombre}</strong>
            </div>
          )}

          {/* Botón para volver */}
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.history.back()}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver a Materias
          </Button>
        </Card>
      </div>
    );
  }

  // Si no está inscrito o fue rechazado, mostrar modal de inscripción
  return (
    <div className="app-page flex items-center justify-center">
      <Card className="w-full max-w-2xl px-5 py-10 text-center sm:px-8 sm:py-12">
        {/* Icono */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 sm:h-24 sm:w-24">
          <svg
            className="w-12 h-12 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>

        {/* Título */}
        <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
          {estado?.estado === 'rechazado'
            ? 'Solicitud Rechazada'
            : 'Inscripción Requerida'}
        </h1>

        {/* Mensaje */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          {estado?.estado === 'rechazado' ? (
            <>
              Tu solicitud anterior fue rechazada.
              {estado.inscripcion?.mensaje && (
                <span className="block mt-2 text-sm italic">
                  Motivo: "{estado.inscripcion.mensaje}"
                </span>
              )}
              <span className="block mt-2">
                Puedes volver a solicitar inscripción a{' '}
                <strong>{materiaNombre}</strong>.
              </span>
            </>
          ) : (
            <>
              Para acceder al contenido de <strong>{materiaNombre}</strong>,
              primero debes solicitar inscripción y esperar la aprobación del
              profesor.
            </>
          )}
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.history.back()}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowModal(true)}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Solicitar Inscripción
          </Button>
        </div>
      </Card>

      {/* Modal de inscripción */}
      <InscripcionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          refetch();
        }}
        materiaId={materiaId}
        materiaNombre={materiaNombre}
        cursadaId={cursadaId}
      />
    </div>
  );
};

export default MateriaAccessGuard;
