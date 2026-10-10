import { apiService } from '../../../shared/services/api.service';
import { Inicio } from '../types/home.types';

class HomeService {
  async getMateriaInicio(): Promise<Inicio> {
    try {
      const materiaId = import.meta.env.VITE_MATERIA_ID || '1';
      return await apiService.get<Inicio>(`/inicio/${materiaId}`);
    } catch (error: any) {
      console.error('Error loading inicio data from backend:', error);

      if (error.response) {
        console.error(
          'Error de respuesta del servidor:',
          error.response.status,
          error.response.data
        );
        throw new Error(
          `Error del servidor: ${error.response.status} - ${error.response.statusText}`
        );
      }

      if (error.request) {
        console.error('No se recibió respuesta del servidor:', error.request);
        throw new Error(
          'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'
        );
      }

      console.error('Error al configurar la petición:', error.message);
      throw new Error(`Error al cargar los datos: ${error.message}`);
    }
  }
}

export const homeService = new HomeService();
