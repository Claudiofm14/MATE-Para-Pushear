import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, LogIn, Users } from 'lucide-react';
import { useAuth } from '../auth/contexts/AuthContext';

const features = [
  {
    title: 'Materias',
    description: 'Accedé a todas tus materias en un solo lugar.',
    icon: BookOpen,
  },
  {
    title: 'Material académico',
    description: 'Consultá documentos, guías y recursos de estudio.',
    icon: FileText,
  },
  {
    title: 'Comunidad',
    description: 'Conectá con docentes y compañeros de estudio.',
    icon: Users,
  },
];

const WelcomePage: React.FC = () => {
  const { login, authenticated, isInitialized } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isInitialized && authenticated) {
      navigate('/materias', { replace: true });
    }
  }, [isInitialized, authenticated, navigate]);

  return (
    <div className="tech-hero relative min-h-screen overflow-hidden text-white">
      <div className="tech-hero-ambient" aria-hidden="true">
        <div className="tech-code-line tech-code-line-1">
          const campus = await unahur.login();
        </div>
        <div className="tech-code-line tech-code-line-3">
          git pull contenidos
        </div>
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-cyan-100">
            Materiales Tecnológicos
          </span>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Universidad Nacional de Hurlingham
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-200">
            Accedé a tus materias, materiales de estudio y canales de cursada
            desde un espacio digital organizado para la comunidad educativa.
          </p>
          <button
            onClick={() => login()}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 text-base font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-100"
          >
            <LogIn className="h-5 w-5" />
            Acceder a la plataforma
          </button>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map(feature => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl shadow-slate-950/20 backdrop-blur"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-black">{feature.title}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;
