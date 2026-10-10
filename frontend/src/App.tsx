import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './app/auth/contexts/AuthContext';
import { useAuth } from './app/auth/contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';
import RoleBasedRoute from './components/RoleBasedRoute';
import { MaintenanceStatus, usuarioService } from './services/usuario.service';
import './App.css';
import { UserActivityTracker } from './components/UserActivityTracker';
import { SoporteWidget } from './components/soporte/SoporteWidget';
import { StudentPreviewProvider } from './contexts/StudentPreviewContext';

const MateriasPage = React.lazy(() => import('./app/materias/page'));
const MateriaPage = React.lazy(() => import('./app/materia/page'));
const ContratoPedagogicoPage = React.lazy(() =>
  import('./app/contrato-pedagogico/page').then(module => ({
    default: module.ContratoPedagogicoPage,
  }))
);
const MaterialAcademico = React.lazy(
  () => import('./app/material-academico/page')
);
const Videos = React.lazy(() => import('./app/videos/page'));
const SemanasPage = React.lazy(() =>
  import('./app/semanas/page').then(module => ({
    default: module.SemanasPage,
  }))
);
const SemanaDetailPage = React.lazy(() =>
  import('./app/semanas/[id]/page').then(module => ({
    default: module.SemanaDetailPage,
  }))
);
const CronogramaPage = React.lazy(() => import('./app/cronograma/page'));
const MisAlumnosPage = React.lazy(() =>
  import('./app/mis-alumnos/page').then(module => ({
    default: module.MisAlumnosPage,
  }))
);
const NotFoundPage = React.lazy(() =>
  import('./app/not-found/page').then(module => ({
    default: module.NotFoundPage,
  }))
);
const AdminSolicitudesPage = React.lazy(() =>
  import('./app/admin/solicitudes/page').then(module => ({
    default: module.AdminSolicitudesPage,
  }))
);
const AdminUsuariosPage = React.lazy(() => import('./app/admin/usuarios/page'));
const AdminEstadisticasPage = React.lazy(
  () => import('./app/admin/estadisticas/page')
);
const AdminReportesPage = React.lazy(() => import('./app/admin/reportes/page'));
const DashboardPage = React.lazy(() => import('./app/dashboard/page'));
const CalendarioPage = React.lazy(() => import('./app/calendario/page'));
const BuscarPage = React.lazy(() => import('./app/buscar/page'));
const PlanillaSeguimientoPage = React.lazy(
  () => import('./app/materia/[id]/planilla-seguimiento/page')
);
const MateriaLogsPage = React.lazy(
  () => import('./app/materia/[id]/logs/page')
);
const MateriaConfiguracionPage = React.lazy(
  () => import('./app/materia/[id]/configuracion/page')
);
const HistorialAlumnoPage = React.lazy(
  () => import('./app/materia/[id]/alumno/[alumnoId]/historial/page')
);
const PapeleraPage = React.lazy(
  () => import('./app/materia/[id]/papelera/page')
);
const GiteaStatusPage = React.lazy(
  () => import('./app/materia/[id]/gitea/page')
);
const MisEjerciciosPage = React.lazy(
  () => import('./app/materia/[id]/mis-ejercicios/page')
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <StudentPreviewProvider>
          <Toaster
            position="top-right"
            containerStyle={{ zIndex: 2147483647 }}
          />
          <UserActivityTracker />

          <React.Suspense fallback={<LoadingSpinner />}>
            <MaintenanceGate>
              <Routes>
                <Route path="/" element={<MateriasPage />} />
                <Route path="/materias" element={<MateriasPage />} />
                <Route
                  path="/materia/:id"
                  element={
                    <Layout>
                      <MateriaPage />
                    </Layout>
                  }
                />

                <Route
                  path="/materia/:id/contrato-pedagogico"
                  element={
                    <Layout>
                      <ContratoPedagogicoPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/material"
                  element={
                    <Layout>
                      <MaterialAcademico />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/videos"
                  element={
                    <Layout>
                      <Videos />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/semanas"
                  element={
                    <Layout>
                      <SemanasPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/semanas/:semanaId"
                  element={
                    <Layout>
                      <SemanaDetailPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/cronograma"
                  element={
                    <Layout>
                      <CronogramaPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/mis-alumnos"
                  element={
                    <Layout>
                      <MisAlumnosPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/planilla-seguimiento"
                  element={
                    <Layout>
                      <PlanillaSeguimientoPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/alumno/:alumnoId/historial"
                  element={
                    <Layout>
                      <HistorialAlumnoPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/logs"
                  element={
                    <Layout>
                      <MateriaLogsPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/configuracion"
                  element={
                    <Layout>
                      <MateriaConfiguracionPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/papelera"
                  element={
                    <Layout>
                      <PapeleraPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/gitea"
                  element={
                    <Layout>
                      <GiteaStatusPage />
                    </Layout>
                  }
                />
                <Route
                  path="/materia/:id/mis-ejercicios"
                  element={
                    <Layout>
                      <MisEjerciciosPage />
                    </Layout>
                  }
                />
                <Route
                  path="/admin/solicitudes"
                  element={
                    <RoleBasedRoute
                      requiredRoles={['admin']}
                      redirectTo="/materias"
                    >
                      <AdminSolicitudesPage />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/admin/usuarios"
                  element={
                    <RoleBasedRoute
                      requiredRoles={['admin']}
                      redirectTo="/materias"
                    >
                      <AdminUsuariosPage />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/admin/estadisticas"
                  element={
                    <RoleBasedRoute
                      requiredRoles={['admin']}
                      redirectTo="/materias"
                    >
                      <AdminEstadisticasPage />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/admin/reportes"
                  element={
                    <RoleBasedRoute
                      requiredRoles={['admin']}
                      redirectTo="/materias"
                    >
                      <AdminReportesPage />
                    </RoleBasedRoute>
                  }
                />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/calendario" element={<CalendarioPage />} />
                <Route path="/buscar" element={<BuscarPage />} />
                <Route
                  path="*"
                  element={
                    <Layout>
                      <NotFoundPage />
                    </Layout>
                  }
                />
              </Routes>
              <SoporteWidget />
            </MaintenanceGate>
          </React.Suspense>
        </StudentPreviewProvider>
      </Router>
    </AuthProvider>
  );
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { authenticated, isInitialized, hasRole, login, logout } = useAuth();
  const [maintenance, setMaintenance] =
    React.useState<MaintenanceStatus | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadMaintenance() {
      try {
        const status = await usuarioService.obtenerMaintenanceStatus();
        if (!cancelled) setMaintenance(status);
      } catch {
        if (!cancelled) setMaintenance(null);
      }
    }

    loadMaintenance();
    const interval = window.setInterval(loadMaintenance, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const shouldBlock =
    isInitialized && maintenance?.enabled && !hasRole('admin');

  if (!shouldBlock) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="mb-4 inline-flex rounded-full bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-200">
          Mantenimiento programado
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          {maintenance?.title || 'Campus en mantenimiento'}
        </h1>
        <p className="mt-3 text-slate-300">
          {maintenance?.message ||
            'Estamos realizando tareas de mantenimiento. El acceso se restablecera cuando finalicen los trabajos.'}
        </p>
        {maintenance?.estimatedUntil && (
          <p className="mt-4 text-sm text-slate-400">
            Estimado hasta:{' '}
            {new Date(maintenance.estimatedUntil).toLocaleString('es-AR')}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {!authenticated ? (
            <button
              type="button"
              onClick={() => login('/admin/usuarios')}
              className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/30"
            >
              Ingresar como administrador
            </button>
          ) : (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10"
            >
              Cerrar sesion
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
