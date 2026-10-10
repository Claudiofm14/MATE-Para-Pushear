import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/contexts/AuthContext';
import { useInicioMateria } from '../../hooks/useInicioMateria';
import { InicioModal } from '../../components/InicioModal';
import { WelcomeSectionComponent } from '../../components/WelcomeSectionComponent';
import { ImportantNoticeSectionComponent } from '../../components/ImportantNoticeSectionComponent';
import { CommunicationChannelsSectionComponent } from '../../components/CommunicationChannelsSectionComponent';
import { QuickLinksSectionComponent } from '../../components/QuickLinksSectionComponent';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorComponent } from '../../components/ErrorComponent';
import { MateriaAccessGuard } from '../../components/MateriaAccessGuard';
import { BlockRenderer } from '../../components/BlockRenderer';
import { usePermissions } from '../../hooks/usePermissions';
import { apiService } from '../../shared/services/api.service';
import { Button } from '../../shared/design-system/components/Button';
import { Card } from '../../shared/design-system/components/Card';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Pencil,
  PlayCircle,
  Sparkles,
} from 'lucide-react';

const materiaPageDataCache = new Map<
  string,
  { materiaNombre: string; cursadaId: number }
>();

/**
 * Página de una materia específica
 * Muestra el contenido de inicio, material académico, etc. de una materia
 * Requiere autenticación y roles (docente o alumno)
 */
export function MateriaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authenticated, hasAnyRole, auth } = useAuth();
  const { isDocente, isAdmin } = usePermissions();
  const hasRequiredRole = hasAnyRole(['admin', 'docente', 'alumno']);
  const cachedMateriaData = id ? materiaPageDataCache.get(id) : undefined;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materiaNombre, setMateriaNombre] = useState<string>(
    cachedMateriaData?.materiaNombre || ''
  );
  const [cursadaId, setCursadaId] = useState<number>(
    cachedMateriaData?.cursadaId || 0
  );
  const [loadingMateriaData, setLoadingMateriaData] = useState(
    id ? !materiaPageDataCache.has(id) : true
  );

  // Cargar el inicio específico de esta materia
  const { inicio, loading, error, refetch } = useInicioMateria(id);

  // Cargar el nombre de la materia y la cursada activa
  React.useEffect(() => {
    const fetchMateriaData = async () => {
      if (id) {
        const cached = materiaPageDataCache.get(id);
        if (cached) {
          setMateriaNombre(cached.materiaNombre);
          setCursadaId(cached.cursadaId);
          setLoadingMateriaData(false);
          return;
        }

        setLoadingMateriaData(true);
        try {
          // Cargar nombre de materia
          const materia = await apiService.get<any>(`/materia/${id}`);
          setMateriaNombre(materia.nombre);

          // Cargar cursada activa (la más reciente)
          const cursadas = await apiService.get<any[]>(
            `/cursada/materia/${id}`
          );
          if (cursadas && cursadas.length > 0) {
            // Ordenar por ID descendente para obtener la más reciente
            // TODO: En el futuro, filtrar por fecha o flag 'activa'
            const cursadaActiva =
              cursadas.find(cursada => cursada.activa) || cursadas[0];
            setCursadaId(cursadaActiva.id);
            materiaPageDataCache.set(id, {
              materiaNombre: materia.nombre,
              cursadaId: cursadaActiva.id,
            });
          } else {
            setCursadaId(0);
            materiaPageDataCache.set(id, {
              materiaNombre: materia.nombre,
              cursadaId: 0,
            });
          }
        } catch (err) {
          console.error('Error fetching materia data:', err);
        } finally {
          setLoadingMateriaData(false);
        }
      }
    };
    fetchMateriaData();
  }, [id]);

  // Función para crear o actualizar inicio
  const handleSaveInicio = async (data: {
    titulo: string;
    materiaId: number;
    contenedores: any[];
    contenido?: any;
  }) => {
    try {
      // Limpiar contenedores: solo enviar los que tengan al menos titulo o subtitulo
      const contenedoresLimpios = data.contenedores
        .filter(c => c.titulo || c.subtitulo)
        .map(contenedor => ({
          titulo: contenedor.titulo || undefined,
          subtitulo: contenedor.subtitulo || undefined,
          tipo: contenedor.tipo,
          hijos:
            contenedor.hijos
              ?.filter((h: any) => h.titulo || h.subtitulo)
              .map((hijo: any) => ({
                titulo: hijo.titulo || undefined,
                subtitulo: hijo.subtitulo || undefined,
                tipo: 'subNivel',
              })) || undefined,
        }));

      const payload = {
        titulo: data.titulo,
        contenedores: contenedoresLimpios,
        contenido: data.contenido,
      };

      if (inicio) {
        // Actualizar inicio existente
        await apiService.put(`/inicio/${inicio.id}`, payload);
      } else {
        // Crear nuevo inicio
        await apiService.post('/inicio', {
          ...payload,
          materiaId: data.materiaId,
        });
      }

      // Recargar los datos
      await refetch();

      setIsModalOpen(false);
    } catch (error: any) {
      console.error('❌ Error al guardar inicio:', error);

      // Mostrar detalles del error de validación
      if (error.response?.data) {
        console.error('📋 Detalles del error:', error.response.data);
        const errorMsg = error.response.data.message
          ? Array.isArray(error.response.data.message)
            ? error.response.data.message.join(', ')
            : error.response.data.message
          : 'Error desconocido';
        alert(`Error de validación: ${errorMsg}`);
      } else {
        alert('Error al guardar el inicio. Por favor, intenta de nuevo.');
      }

      throw error;
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Si no está autenticado, redirigir a welcome
  React.useEffect(() => {
    if (!authenticated) {
      navigate('/');
    }
  }, [authenticated, navigate]);

  // Si no tiene el rol requerido, redirigir a materias
  React.useEffect(() => {
    if (authenticated && !hasRequiredRole) {
      navigate('/materias');
    }
  }, [authenticated, hasRequiredRole, navigate]);

  // Mostrar loading mientras carga
  if (!auth || loading || loadingMateriaData) {
    return <LoadingSpinner />;
  }
  if (error === 'FORBIDDEN') {
    return (
      <>
        <MateriaAccessGuard
          materiaId={parseInt(id || '0')}
          materiaNombre={materiaNombre || 'Materia'}
          cursadaId={cursadaId}
          onAccessGranted={refetch}
        >
          <LoadingSpinner />
        </MateriaAccessGuard>
      </>
    );
  }

  // Mostrar error si hay algún problema
  if (error) {
    // Si es un error 404 (no hay inicio), mostrar interfaz de creación
    if (error.includes('No se encontró un inicio para esta materia')) {
      return (
        <>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Contenido principal */}
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-3xl mx-auto">
                <Card className="text-center py-12">
                  {/* Icono */}
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <svg
                      className="w-12 h-12 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>

                  {/* Título */}
                  <h1 className="mb-4 text-3xl font-bold text-gray-950 dark:text-white md:text-4xl">
                    {materiaNombre || 'Materia'}
                  </h1>

                  {isDocente || isAdmin ? (
                    <div className="space-y-8">
                      <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl mx-auto">
                        Esta materia aún no tiene contenido configurado. <br />
                        Como docente, puedes crear el contenido inicial.
                      </p>

                      <Button
                        size="lg"
                        onClick={handleOpenModal}
                        className="shadow-lg hover:shadow-xl"
                      >
                        <svg
                          className="w-6 h-6 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Crear Contenido de Inicio
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl mx-auto">
                        Esta materia aún no tiene contenido disponible. <br />
                        Por favor, contacta a tu docente.
                      </p>

                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => navigate('/materias')}
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
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>

          {/* Modal de creación */}
          <InicioModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveInicio}
            materiaId={parseInt(id || '0')}
            materiaNombre={materiaNombre}
            inicioExistente={null}
          />
        </>
      );
    }

    // Para otros tipos de errores
    return (
      <>
        <div className="container mx-auto px-4 py-8">
          <ErrorComponent error={error} onRetry={refetch} />
        </div>
      </>
    );
  }

  if (!inicio) {
    // Si no hay inicio y no hay error específico, tratar como materia sin contenido
    return (
      <>
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto">
              <Card className="text-center py-12">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <svg
                    className="w-12 h-12 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>

                <h1 className="mb-4 text-3xl font-bold text-gray-950 dark:text-white md:text-4xl">
                  {materiaNombre || 'Materia'}
                </h1>

                {isDocente || isAdmin ? (
                  <div className="space-y-8">
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl mx-auto">
                      Esta materia necesita configuración inicial.
                    </p>
                    <Button
                      size="lg"
                      onClick={handleOpenModal}
                      className="shadow-lg hover:shadow-xl"
                    >
                      <svg
                        className="w-6 h-6 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Crear Contenido de Inicio
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl mx-auto">
                      Esta materia aún no tiene contenido disponible.
                    </p>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => navigate('/materias')}
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
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Modal de creación */}
          <InicioModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveInicio}
            materiaId={parseInt(id || '0')}
            materiaNombre={materiaNombre}
            inicioExistente={null}
          />
        </div>
      </>
    );
  }

  // Mapear contenedores del backend a las secciones del frontend
  const mapContenedoresToSections = () => {
    const sections = {
      hero: {
        title: inicio.titulo || inicio.materia.nombre,
        subtitle: `Materia: ${inicio.materia.codigo}`,
        universityName: 'UNAHUR',
        backgroundImage: '/images/hero-bg.jpg',
      },
      welcome: {
        title: 'Bienvenidos',
        message: '',
        content: [] as string[],
      },
      importantNotice: {
        title: 'Avisos Importantes',
        description: '',
        requirements: [] as { name: string; description?: string }[],
        items: [] as string[],
      },
      communicationChannels: {
        title: 'Canales de Comunicación',
        description: '',
        channels: [] as any[],
      },
      quickLinks: {
        title: 'Enlaces Rápidos',
        links: [] as any[],
      },
    };

    // Iterar sobre los contenedores y mapearlos a las secciones correspondientes
    inicio.contenedores?.forEach((inicioContenedor: any) => {
      const contenedor = inicioContenedor.contenedor;

      switch (contenedor.tipo) {
        case 'bienvenida':
          sections.welcome = {
            title: contenedor.titulo || 'Bienvenidos',
            message: '',
            content: contenedor.subtitulo ? [contenedor.subtitulo] : [],
          };
          break;

        case 'detalleCursada':
          sections.importantNotice = {
            title: contenedor.titulo || 'Detalles de la Cursada',
            description: contenedor.subtitulo || '',
            requirements:
              contenedor.hijos
                ?.map((h: any) => ({
                  name: h.titulo || '',
                  description: h.subtitulo || '',
                }))
                .filter((r: any) => r.name) || [],
            items:
              contenedor.hijos
                ?.map((h: any) => `${h.titulo}: ${h.subtitulo}`)
                .filter(Boolean) || [],
          };
          break;

        case 'canalDeComunicacion':
          sections.communicationChannels = {
            title: contenedor.titulo || 'Canales de Comunicación',
            description: contenedor.subtitulo || '',
            channels:
              contenedor.hijos?.map((h: any) => ({
                name: h.titulo || '',
                description: '', // Sin descripción, solo el botón
                icon: '💬',
                directLink: {
                  text: 'Ingresa aquí',
                  url: h.subtitulo || '#',
                },
              })) || [],
          };
          break;

        case 'evaluacion':
        case 'entregas':
        case 'aprobacion':
          // Agregar como enlaces rápidos
          sections.quickLinks.links.push({
            title: contenedor.titulo || contenedor.tipo,
            description: contenedor.subtitulo || '',
            icon: '📝',
            link: '#',
          });
          break;

        case 'cronograma':
          sections.quickLinks.links.push({
            title: contenedor.titulo || 'Cronograma',
            description: contenedor.subtitulo || '',
            icon: '📅',
            link: '#',
          });
          break;
      }
    });

    return sections;
  };

  const transformedData = mapContenedoresToSections();
  const hasCustomContent = Boolean(inicio.contenido?.blocks?.length);
  const materiaActualNombre = inicio?.materia.nombre || materiaNombre;
  const materiaActualCodigo = inicio?.materia.codigo || `ID ${id}`;
  const quickAccessItems = [
    {
      label: 'Material',
      description: 'Recursos y bibliografia',
      icon: BookOpen,
      path: `/materia/${id}/material`,
    },
    {
      label: 'Videos',
      description: 'Clases y tutoriales',
      icon: PlayCircle,
      path: `/materia/${id}/videos`,
    },
    {
      label: 'Semanas',
      description: 'Cronograma de cursada',
      icon: CalendarDays,
      path: `/materia/${id}/semanas`,
    },
    // ✅ AGREGAR ESTA LÍNEA
    {
      label: 'Contrato Pedagógico',
      description: 'Términos y condiciones',
      icon: FileText,
      path: `/materia/${id}/contrato-pedagogico`,
    },
    {
      label: 'Planilla',
      description: 'Seguimiento academico',
      icon: FileText,
      path: `/materia/${id}/planilla-seguimiento`,
    },
  ];

  return (
    <>
      <MateriaAccessGuard
        materiaId={parseInt(id || '0')}
        materiaNombre={inicio?.materia.nombre || materiaNombre}
        cursadaId={cursadaId}
      >
        <div className="materia-page-shell">
          <div className="materia-page-gradient" />
          <div className="materia-page-grid" />

          {(isDocente || isAdmin) && (
            <div className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-5 sm:left-auto sm:right-5">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300/60 bg-white/95 p-3 text-slate-950 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:border-amber-300/30 dark:bg-slate-950/90 dark:text-white dark:shadow-slate-950/35 sm:justify-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-300 text-slate-950">
                  <Pencil className="h-5 w-5" />
                </div>
                <div className="hidden sm:block">
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">
                    Modo Edicion
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    Personaliza el contenido
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={handleOpenModal}
                  className="rounded-xl border-none bg-amber-300 px-5 text-slate-950 shadow-sm hover:bg-amber-200 hover:shadow-md"
                >
                  Editar
                </Button>
              </div>
            </div>
          )}

          <div className="relative z-10 space-y-8 pb-14">
            <section className="materia-hero">
              <div className="mx-auto grid max-w-screen-2xl gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                <div>
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <span className="materia-chip-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                      <Sparkles className="h-3.5 w-3.5" />
                      Aula digital ITI
                    </span>
                    <span className="materia-chip-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold">
                      {materiaActualCodigo}
                    </span>
                    {(isDocente || isAdmin) && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
                        Gestion docente
                      </span>
                    )}
                  </div>
                  <h1 className="materia-hero-title max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
                    {transformedData.hero.title}
                  </h1>
                  <p className="materia-hero-description mt-4 max-w-3xl text-lg font-medium leading-8">
                    Materia: {materiaActualNombre}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/materia/${id}/material`)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-300"
                    >
                      Ir a material
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate('/materias')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-bold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                      Volver a materias
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div className="container mx-auto space-y-8 px-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {quickAccessItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className="group rounded-3xl border border-slate-200 bg-white/[0.96] p-5 text-left shadow-xl shadow-slate-950/15 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/90"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-emerald-300 transition-transform duration-300 group-hover:scale-105 dark:bg-emerald-300 dark:text-slate-950">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-950 dark:text-white">
                        {item.label}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {hasCustomContent ? (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/[0.96] p-6 shadow-2xl shadow-slate-950/15 dark:border-white/10 dark:bg-slate-900/90 sm:p-8">
                  <BlockRenderer content={inicio.contenido} color="green" />
                </div>
              ) : (
                <>
                  <div>
                    <WelcomeSectionComponent
                      welcome={transformedData.welcome}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-8">
                      <ImportantNoticeSectionComponent
                        importantNotice={transformedData.importantNotice}
                      />
                    </div>

                    <div className="space-y-6 lg:col-span-4">
                      <div className="sticky top-24 space-y-6">
                        <QuickLinksSectionComponent
                          quickLinks={transformedData.quickLinks}
                        />
                        <CommunicationChannelsSectionComponent
                          communicationChannels={
                            transformedData.communicationChannels
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </MateriaAccessGuard>
      <InicioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInicio}
        materiaId={parseInt(id || '0')}
        materiaNombre={inicio?.materia.nombre || materiaNombre}
        inicioExistente={
          inicio
            ? {
                id: inicio.id,
                titulo: inicio.titulo,
                contenido: inicio.contenido,
                contenedores:
                  inicio.contenedores?.map((ic: any) => ({
                    ...ic.contenedor,
                    hijos: ic.contenedor.hijos || [],
                  })) || [],
              }
            : null
        }
      />
    </>
  );
}

export default MateriaPage;
