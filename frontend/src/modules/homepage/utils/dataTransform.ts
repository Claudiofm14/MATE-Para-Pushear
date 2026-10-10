import { Inicio, HomePageData } from '../types/home.types';

/**
 * Transforma los datos del backend al formato que espera el frontend
 */
export const transformBackendToFrontend = (
  inicioData: Inicio
): HomePageData => {
  // Encontrar contenedores por tipo
  const bienvenidaContainer = inicioData.contenedores.find(
    c => c.tipo === 'bienvenida'
  );
  const detalleCursadaContainer = inicioData.contenedores.find(
    c => c.tipo === 'detalleCursada'
  );
  const canalComunicacionContainer = inicioData.contenedores.find(
    c => c.tipo === 'canalDeComunicacion'
  );

  const transformedData = {
    hero: {
      title: inicioData.titulo,
      subtitle: 'Universidad Nacional de Hurlingham',
      universityName: 'UNAHUR',
      logo: {
        url: '/logo192.png',
        alt: 'UNAHUR Logo',
      },
    },
    welcome: {
      title: bienvenidaContainer?.titulo || '¡Bienvenido/a!',
      content: [
        bienvenidaContainer?.subtitulo || 'Bienvenido a la materia',
        'Aquí encontrarás todo lo necesario para tu cursada.',
      ],
      scheduleLink: {
        text: '📅 Cronograma de la cursada',
        url: '/cronograma',
        icon: '📅',
      },
      materialLink: {
        text: '📚 Material de estudio',
        url: '/material-academico',
      },
    },
    importantNotice: {
      title: detalleCursadaContainer?.titulo || 'Avisos Importantes',
      description:
        detalleCursadaContainer?.subtitulo || 'No hay avisos en este momento.',
      requirements:
        detalleCursadaContainer?.hijos?.map(hijo => ({
          name: hijo.titulo,
          description: hijo.subtitulo,
        })) || [],
    },
    communicationChannels: {
      title: canalComunicacionContainer?.titulo || 'Canales de Comunicación',
      description: 'Mantente conectado con la catedra',
      channels:
        canalComunicacionContainer?.hijos?.map(hijo => ({
          name: hijo.titulo,
          description: hijo.subtitulo,
          icon: hijo.titulo.toLowerCase().includes('discord')
            ? '💬'
            : hijo.titulo.toLowerCase().includes('whatsapp')
              ? '📱'
              : '📧',
          directLink: {
            text: `Ir a ${hijo.titulo}`,
            url: hijo.subtitulo.startsWith('http')
              ? hijo.subtitulo
              : `https://${hijo.subtitulo}`,
          },
        })) || [],
    },
    quickLinks: {
      title: 'Accesos Rápidos',
      links: [
        {
          text: 'Material Académico',
          url: '/material-academico',
          icon: '📚',
          description: 'Accede a todo el material de estudio',
        },
        // {
        //   text: 'Contrato Pedagógico',
        //   url: '/contrato-pedagogico',
        //   icon: '📋',
        //   description: 'Términos y condiciones de la cursada',
        // },
      ],
    },
  };

  return transformedData;
};
