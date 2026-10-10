import api from './api.client';

export interface MaterialAcademico {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo?: string;
  categoria?: string;
  url?: string;
  textoBoton?: string;
  contenido?: any;
  icono?: string;
  color?: string;
  orden: number;
  visible: boolean;
  materiaId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialAcademicoDto {
  titulo: string;
  descripcion?: string;
  tipo?: string;
  categoria?: string;
  url?: string;
  textoBoton?: string;
  contenido?: any;
  icono?: string;
  color?: string;
  orden?: number;
  visible?: boolean;
  materiaId?: number;
}

export interface UpdateMaterialAcademicoDto {
  titulo?: string;
  descripcion?: string;
  tipo?: string;
  categoria?: string;
  url?: string;
  textoBoton?: string;
  contenido?: any;
  icono?: string;
  color?: string;
  orden?: number;
  visible?: boolean;
  materiaId?: number;
}

export const materialAcademicoService = {
  async getAll(): Promise<MaterialAcademico[]> {
    const response = await api.get('/material-academico');
    return response.data;
  },

  async getByMateria(materiaId: number): Promise<MaterialAcademico[]> {
    const response = await api.get(`/material-academico/materia/${materiaId}`);
    return response.data;
  },

  async getByCategoria(categoria: string): Promise<MaterialAcademico[]> {
    const response = await api.get(
      `/material-academico/categoria/${categoria}`
    );
    return response.data;
  },

  async getById(id: number): Promise<MaterialAcademico> {
    const response = await api.get(`/material-academico/${id}`);
    return response.data;
  },

  async create(data: CreateMaterialAcademicoDto): Promise<MaterialAcademico> {
    const response = await api.post('/material-academico', data);
    return response.data;
  },

  async update(
    id: number,
    data: UpdateMaterialAcademicoDto
  ): Promise<MaterialAcademico> {
    const response = await api.put(`/material-academico/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/material-academico/${id}`);
  },

  async reorder(items: { id: number; orden: number }[]): Promise<void> {
    await api.put('/material-academico/reorder/batch', items);
  },
};
