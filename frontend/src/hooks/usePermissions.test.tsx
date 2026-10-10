import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usuarioService } from '../services/usuario.service';
import { usePermissions } from './usePermissions';

const roles = new Set<string>();
let previewSelection: null | { materiaId: number } = null;

vi.mock('../app/auth/contexts/AuthContext', () => ({
  useAuth: () => ({
    userInfo: { rol: 'alumno' },
    authenticated: true,
    hasRole: (role: string) => roles.has(role),
    hasAnyRole: (required: string[]) => required.some(role => roles.has(role)),
  }),
}));

vi.mock('react-router-dom', async importOriginal => {
  const original = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...original,
    useLocation: () => ({ pathname: '/materia/1' }),
  };
});

vi.mock('../services/usuario.service', () => ({
  usuarioService: {
    obtenerMateriasProfesor: vi.fn(),
  },
}));

vi.mock('../contexts/StudentPreviewContext', () => ({
  useStudentPreview: () => ({ selection: previewSelection }),
}));

describe('usePermissions', () => {
  beforeEach(() => {
    roles.clear();
    previewSelection = null;
    vi.mocked(usuarioService.obtenerMateriasProfesor).mockReset();
  });

  it('no consulta materias de profesor para un alumno', async () => {
    roles.add('alumno');

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => expect(result.current.loadingPermissions).toBe(false));
    expect(usuarioService.obtenerMateriasProfesor).not.toHaveBeenCalled();
    expect(result.current.isAlumno).toBe(true);
  });

  it('mantiene la autorización real pero desactiva la edición en vista previa', async () => {
    roles.add('docente');
    previewSelection = { materiaId: 1 };
    vi.mocked(usuarioService.obtenerMateriasProfesor).mockResolvedValue([
      { materia: { id: 1 } },
    ] as any);

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => expect(result.current.loadingPermissions).toBe(false));
    expect(result.current.actualCanManageCurrentMateria).toBe(true);
    expect(result.current.isPreviewingAsStudent).toBe(true);
    expect(result.current.canManageCurrentMateria).toBe(false);
    expect(result.current.canEdit).toBe(false);
    expect(result.current.isAlumno).toBe(true);
  });
});
