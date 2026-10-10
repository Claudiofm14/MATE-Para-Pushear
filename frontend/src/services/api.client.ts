import { apiService } from '../shared/services/api.service';

// Reutilizamos la instancia de axios del servicio compartido que ya tiene
// configurados los interceptores de Auth.js correctamente.
export const apiClient = apiService.getAxiosInstance();

export default apiClient;
