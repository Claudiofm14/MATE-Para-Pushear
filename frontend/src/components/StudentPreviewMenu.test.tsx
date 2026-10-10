import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { comisionService } from '../services/comision.service';
import { StudentPreviewMenu } from './StudentPreviewMenu';

const previewState = vi.hoisted(() => ({
  isPreviewing: false,
  selection: null as null | { comisionNombre: string },
  startPreview: vi.fn(),
  stopPreview: vi.fn(),
}));
const permissionState = vi.hoisted(() => ({
  actualCanManageCurrentMateria: true,
  loadingPermissions: false,
}));

vi.mock('../contexts/StudentPreviewContext', () => ({
  useStudentPreview: () => previewState,
}));
vi.mock('../hooks/useMateriaCursada', () => ({
  useMateriaCursada: () => ({ cursada: { id: 7 } }),
}));
vi.mock('../hooks/usePermissions', () => ({
  usePermissions: () => permissionState,
}));
vi.mock('../services/comision.service', () => ({
  comisionService: { getByCursada: vi.fn() },
}));

describe('StudentPreviewMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewState.isPreviewing = false;
    previewState.selection = null;
    permissionState.actualCanManageCurrentMateria = true;
    vi.mocked(comisionService.getByCursada).mockResolvedValue([
      { id: 2, nombre: 'Comisión 3', cursadaId: 7 },
    ]);
  });

  it('inicia la vista desde una comisión del desplegable', async () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/materia/4/semanas']}>
        <ul>
          <StudentPreviewMenu open onClose={onClose} />
        </ul>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(comisionService.getByCursada).toHaveBeenCalledWith(7)
    );
    fireEvent.change(
      screen.getByLabelText('Seleccionar comisión para vista de alumno'),
      { target: { value: '2' } }
    );

    expect(previewState.startPreview).toHaveBeenCalledWith({
      materiaId: 4,
      cursadaId: 7,
      comisionId: 2,
      comisionNombre: 'Comisión 3',
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('permite salir desde el mismo desplegable', () => {
    previewState.isPreviewing = true;
    previewState.selection = { comisionNombre: 'Comisión 3' };
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/materia/4']}>
        <ul>
          <StudentPreviewMenu open onClose={onClose} />
        </ul>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Salir de la vista de alumno'));
    expect(previewState.stopPreview).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(comisionService.getByCursada).not.toHaveBeenCalled();
  });
});
