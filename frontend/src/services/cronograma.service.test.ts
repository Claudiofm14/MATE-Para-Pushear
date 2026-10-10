import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './api.client';
import { cronogramaService } from './cronograma.service';

vi.mock('./api.client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('cronogramaService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('consulta la cursada y aplica el filtro de comisión', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] } as any);
    await cronogramaService.list(8, 3);
    expect(apiClient.get).toHaveBeenCalledWith('/cronograma/cursada/8', {
      params: { comisionId: 3 },
    });
  });

  it('crea, edita y elimina filas por los endpoints específicos', async () => {
    const input = {
      numeroSemana: 1,
      fecha: '2026-08-22',
      hora: null,
      actividades: 'Actividad',
      temas: 'Tema',
      tareas: 'Tarea',
      comisiones: [{ comisionId: 4, modalidad: 'virtual' as const }],
    };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 9 } } as any);
    vi.mocked(apiClient.put).mockResolvedValue({ data: { id: 9 } } as any);
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} } as any);
    await cronogramaService.create(2, input);
    await cronogramaService.update(9, input);
    await cronogramaService.remove(9);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/cronograma/cursada/2/filas',
      input
    );
    expect(apiClient.put).toHaveBeenCalledWith('/cronograma/filas/9', input);
    expect(apiClient.delete).toHaveBeenCalledWith('/cronograma/filas/9');
  });
});
