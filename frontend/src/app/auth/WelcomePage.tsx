import React from 'react';
import { useAuth } from './contexts/AuthContext';

/**
 * Página de bienvenida pública para usuarios no autenticados
 */
export const WelcomePage: React.FC = () => {
  const { auth } = useAuth();

  const handleLogin = () => {
    if (auth) {
      auth.login();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Materiales Tecnol�gicos - Universidad Nacional de Hurlingham
              </h1>
              <p className="text-xl text-blue-100">
                Bienvenido a tu espacio de aprendizaje
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-12">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Accede a tu cuenta
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Inicia sesión para acceder a los materiales de la materia,
                  contratos pedagógicos y más.
                </p>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="text-center p-6 bg-blue-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Material Académico
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Accede a todo el material de estudio
                  </p>
                </div>

                <div className="text-center p-6 bg-indigo-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Contrato Pedagógico
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Consulta el plan de la materia
                  </p>
                </div>

                <div className="text-center p-6 bg-purple-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Comunicación
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Canales de contacto con docentes
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition hover:scale-105 shadow-lg"
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
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Iniciar Sesión
                </button>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Usa tu cuenta institucional para acceder
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
            Esta plataforma requiere autenticación para acceder al contenido
            educativo
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
