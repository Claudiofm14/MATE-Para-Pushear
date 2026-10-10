import { apiService } from '../../../shared/services/api.service';
import {
  ContratoPedagogico,
  CreateContratoPedagogicoDto,
  UpdateContratoPedagogicoDto,
  DeleteResponse,
} from '../types/contrato-pedagogico.types';

const DEFAULT_MATERIA_ID = Number(import.meta.env.VITE_MATERIA_ID) || 1;

class ContratoPedagogicoService {
  private readonly baseURL: string = '/contrato-pedagogico';

  async getContratoPedagogicoData(
    id: number = DEFAULT_MATERIA_ID
  ): Promise<ContratoPedagogico> {
    return apiService.get<ContratoPedagogico>(`${this.baseURL}/${id}`);
  }

  async getAllContratos(): Promise<ContratoPedagogico[]> {
    return apiService.get<ContratoPedagogico[]>(this.baseURL);
  }

  async createContrato(
    dto: CreateContratoPedagogicoDto
  ): Promise<ContratoPedagogico> {
    return apiService.post<ContratoPedagogico>(this.baseURL, dto);
  }

  async updateContrato(
    id: number,
    dto: UpdateContratoPedagogicoDto
  ): Promise<ContratoPedagogico> {
    return apiService.put<ContratoPedagogico>(`${this.baseURL}/${id}`, dto);
  }

  async deleteContrato(id: number): Promise<DeleteResponse> {
    return apiService.delete<DeleteResponse>(`${this.baseURL}/${id}`);
  }

  // --- NUEVOS ENDPOINTS PARA CONTENEDORES (SECCIONES) ---

  async addContenedor(id: number, dto: any): Promise<ContratoPedagogico> {
    return apiService.post<ContratoPedagogico>(
      `${this.baseURL}/${id}/contenedores`,
      dto
    );
  }

  async removeContenedor(
    id: number,
    contenedorId: number
  ): Promise<ContratoPedagogico> {
    return apiService.delete<ContratoPedagogico>(
      `${this.baseURL}/${id}/contenedores/${contenedorId}`
    );
  }
}

export const contratoPedagogicoService = new ContratoPedagogicoService();
