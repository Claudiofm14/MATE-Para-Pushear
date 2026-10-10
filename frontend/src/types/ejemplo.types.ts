export interface Ejemplo {
  id: number;
  nombre: string;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEjemploDto {
  nombre: string;
  descripcion?: string;
}

export interface UpdateEjemploDto {
  nombre?: string;
  descripcion?: string;
}
