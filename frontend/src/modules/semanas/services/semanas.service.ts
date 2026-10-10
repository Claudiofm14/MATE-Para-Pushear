import { SemanaBackend } from '../types/semanas.types';
import { semanaService } from '../../../services/semana.service';

class SemanasService {
  async getSemanasMateria(materiaId: string): Promise<SemanaBackend[]> {
    try {
      // TODO: Obtener el cursadaId real desde el backend o el contexto actual.
      const cursadaId = 1;
      const semanas = await semanaService.getByCursada(cursadaId);

      return semanas.map(semana => ({
        id: semana.id,
        numeroSemana: semana.numeroSemana,
        titulo: semana.titulo,
        descripcion: semana.descripcion || '',
        fechaInicio: semana.fechaInicio,
        activa: true,
        materiaId: parseInt(materiaId),
        contenedores: [],
        createdAt: semana.createdAt || new Date().toISOString(),
        updatedAt: semana.updatedAt || new Date().toISOString(),
        deletedAt: semana.deletedAt || null,
      }));
    } catch (error: any) {
      console.error('Error loading semanas data:', error);

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

  async getSemanaDetail(
    materiaId: string,
    semanaId: string
  ): Promise<SemanaBackend> {
    try {
      const semana = await semanaService.getById(parseInt(semanaId));

      return {
        id: semana.id,
        numeroSemana: semana.numeroSemana,
        titulo: semana.titulo,
        descripcion: semana.descripcion || '',
        fechaInicio: semana.fechaInicio,
        activa: true,
        materiaId: parseInt(materiaId),
        contenedores: [],
        createdAt: semana.createdAt || new Date().toISOString(),
        updatedAt: semana.updatedAt || new Date().toISOString(),
        deletedAt: semana.deletedAt || null,
      };
    } catch (error: any) {
      console.error('Error loading semana detail:', error);
      throw error;
    }
  }
}

export const semanasService = new SemanasService();
