export interface ContratoPedagogico {
  id: number;
  titulo: string;
  secciones: Contenedor[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Contenedor {
  id: number;
  titulo: string;
  subtitulo?: string;
  tipo: ContenedorTipo;
  hijos?: Contenedor[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type ContenedorTipo =
  | 'bienvenida'
  | 'detalleCursada'
  | 'canalDeComunicacion'
  | 'subNivel'
  | 'evaluacion'
  | 'entregas'
  | 'aprobacion'
  | 'cronograma';

// DTOs para crear y actualizar
export interface CreateContenedorDto {
  titulo?: string;
  subtitulo?: string;
  tipo: ContenedorTipo;
  hijos?: CreateContenedorDto[];
}

export interface CreateContratoPedagogicoDto {
  titulo: string;
  secciones: CreateContenedorDto[];
}

export interface UpdateContenedorDto {
  titulo?: string;
  subtitulo?: string;
  tipo?: ContenedorTipo;
  hijos?: UpdateContenedorDto[];
}

export interface UpdateContratoPedagogicoDto {
  titulo?: string;
  secciones?: UpdateContenedorDto[];
}

// Response de eliminación
export interface DeleteResponse {
  message: string;
}
