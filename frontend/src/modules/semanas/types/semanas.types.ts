export interface WeeksPageData {
  weeks: Week[];
  totalWeeks: number;
  currentWeek?: number;
}

export interface Week {
  id: number;
  weekNumber: number;
  title: string;
  description: string;
  startDate: string;
  isActive: boolean;
  hasImportantNotice: boolean;
  hasVideos: boolean;
  hasExercises: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WeekDetail {
  id: number;
  weekNumber: number;
  title: string;
  description: string;
  startDate: string;
  importantNotice?: ImportantNotice;
  schedules: Schedule[];
  videos: Video[];
  exercises: Exercise[];
  additionalContent?: AdditionalContent[];
  createdAt: string;
  updatedAt: string;
}

export interface ImportantNotice {
  id: number;
  title: string;
  content: string;
  type: 'warning' | 'info' | 'success' | 'error';
  isActive: boolean;
  createdAt: string;
}

export interface Schedule {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  type: 'class' | 'exam' | 'virtual' | 'noclass' | 'special';
  meetLink?: string;
  isActive: boolean;
}

export interface Video {
  id: number;
  title: string;
  description?: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  category?: string;
  createdAt: string;
}

export interface Exercise {
  id: number;
  title: string;
  description?: string;
  url?: string;
  dueDate?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime?: number;
  tags: string[];
  isActive: boolean;
}

export interface AdditionalContent {
  id: number;
  title: string;
  content: string;
  type: 'text' | 'link' | 'file';
  url?: string;
  order: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// === TIPOS PARA BACKEND ===

export interface SemanaBackend {
  id: number;
  numeroSemana: number;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechasClasePorComision?: Record<string, string>;
  activa: boolean;
  contenedores: ContenedorSemana[];
  materiaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ContenedorSemana {
  id: number;
  titulo: string;
  subtitulo: string;
  tipo:
    | 'avisoImportante'
    | 'horarios'
    | 'videos'
    | 'ejercicios'
    | 'contenidoAdicional';
  contenido?: string;
  orden: number;
  activo: boolean;
  hijos?: ContenedorSemana[];
  metadatos?: {
    url?: string;
    fecha?: string;
    horaInicio?: string;
    horaFin?: string;
    ubicacion?: string;
    tipoHorario?: string;
    enlaceMeet?: string;
    duracion?: number;
    categoria?: string;
    dificultad?: string;
    tiempoEstimado?: number;
    fechaVencimiento?: string;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
