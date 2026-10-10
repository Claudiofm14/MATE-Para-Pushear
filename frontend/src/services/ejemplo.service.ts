import axios from 'axios';
import {
  Ejemplo,
  CreateEjemploDto,
  UpdateEjemploDto,
} from '../types/ejemplo.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ejemploService = {
  // Obtener todos los ejemplos
  async getAll(): Promise<Ejemplo[]> {
    const response = await api.get<Ejemplo[]>('/ejemplos');
    return response.data;
  },

  // Obtener un ejemplo por ID
  async getById(id: number): Promise<Ejemplo> {
    const response = await api.get<Ejemplo>(`/ejemplos/${id}`);
    return response.data;
  },

  // Crear un nuevo ejemplo
  async create(data: CreateEjemploDto): Promise<Ejemplo> {
    const response = await api.post<Ejemplo>('/ejemplos', data);
    return response.data;
  },

  // Actualizar un ejemplo
  async update(id: number, data: UpdateEjemploDto): Promise<Ejemplo> {
    const response = await api.put<Ejemplo>(`/ejemplos/${id}`, data);
    return response.data;
  },

  // Eliminar un ejemplo
  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/ejemplos/${id}`);
    return response.data;
  },
};

export default ejemploService;
