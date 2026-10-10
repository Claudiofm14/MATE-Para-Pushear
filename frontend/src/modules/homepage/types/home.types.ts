export interface HomePageData {
  hero: HeroSection;
  welcome: WelcomeSection;
  importantNotice: ImportantNoticeSection;
  communicationChannels: CommunicationChannelsSection;
  quickLinks: QuickLinksSection;
}

export interface HeroSection {
  title: string;
  subtitle: string;
  universityName: string;
  logo?: {
    url: string;
    alt: string;
  };
}

export interface WelcomeSection {
  title: string;
  message?: string;
  content: string[];
  scheduleLink?: {
    text: string;
    url: string;
    icon?: string;
  };
  materialLink?: {
    text: string;
    url: string;
  };
}

export interface ImportantNoticeSection {
  title: string;
  description: string;
  requirements: Requirement[];
  videosLink?: {
    text: string;
    url: string;
  };
}

export interface Requirement {
  name: string;
  description?: string;
}

export interface CommunicationChannelsSection {
  title: string;
  description: string;
  channels: CommunicationChannel[];
}

export interface CommunicationChannel {
  name: string;
  description: string;
  icon: string;
  steps?: ChannelStep[];
  directLink?: {
    text: string;
    url: string;
  };
}

export interface ChannelStep {
  stepNumber: number;
  description: string;
  link?: {
    text: string;
    url: string;
  };
}

export interface QuickLinksSection {
  title: string;
  links: QuickLink[];
}

export interface QuickLink {
  text: string;
  url: string;
  icon?: string;
  description?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// === TIPOS PARA BACKEND ===

export interface Contenedor {
  id: number;
  titulo: string;
  subtitulo: string;
  tipo: 'bienvenida' | 'detalleCursada' | 'canalDeComunicacion' | 'subNivel';
  hijos?: Contenedor[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Inicio {
  id: number;
  titulo: string;
  contenedores: Contenedor[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
