import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUsuariosPage from './page';
import {
  AdminUsuariosPagina,
  usuarioService,
} from '../../../services/usuario.service';

const toast = { success: vi.fn(), error: vi.fn() };
const confirmState = {};
vi.mock('../../auth/contexts/AuthContext', () => ({
  useAuth: () => ({
    isInitialized: true,
    auth: { hasRealmRole: () => true },
    userInfo: { email: 'admin@test.local' },
  }),
}));
vi.mock('../../../hooks', () => ({
  useToast: () => toast,
  useConfirm: () => ({ confirmState, confirm: vi.fn() }),
}));
vi.mock('../../../components/AuthStatus', () => ({ default: () => null }));
vi.mock('../../../components/ConfirmDialog', () => ({
  ConfirmDialog: () => null,
}));
vi.mock('../../../components/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../../../services/usuario.service', () => ({
  usuarioService: {
    obtenerUsuariosAdmin: vi.fn(),
    obtenerUsuariosGiteaAdmin: vi.fn(),
    obtenerAuditoriaAdmin: vi.fn(),
    obtenerMetricasAdmin: vi.fn(),
    obtenerEstadoTecnico: vi.fn(),
    obtenerMateriasDisponibles: vi.fn(),
    obtenerMaintenanceStatus: vi.fn(),
  },
}));

const pageWithUser = (
  nombre = 'Ana',
  giteaError: string | null = null
): AdminUsuariosPagina => ({
  items: [
    {
      key: 'platform-1',
      platformUser: {
        id: 1,
        authProviderId: '101',
        email: 'alumno@test.local',
        nombre,
        apellido: 'Alvarez',
        rol: 'alumno',
        activo: true,
        githubUser: 'ana',
        materiasAlumno: [],
        materiasProfesor: [],
      },
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  gitea: {
    total: giteaError ? 0 : 470,
    syncedAt: giteaError ? null : '2026-10-08T19:00:00Z',
    error: giteaError,
  },
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminUsuariosPage />
    </MemoryRouter>
  );

describe('Admin user loading', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(usuarioService.obtenerUsuariosAdmin).mockResolvedValue(
      pageWithUser()
    );
    vi.mocked(usuarioService.obtenerAuditoriaAdmin).mockResolvedValue([]);
    vi.mocked(usuarioService.obtenerMetricasAdmin).mockResolvedValue({
      usuariosActivos: 470,
      usuariosSuspendidos: 0,
      docentesPendientes: 0,
      materiasActivas: 3,
      entregasRecientes: 0,
    });
    vi.mocked(usuarioService.obtenerEstadoTecnico).mockResolvedValue(
      null as any
    );
    vi.mocked(usuarioService.obtenerMateriasDisponibles).mockResolvedValue([]);
    vi.mocked(usuarioService.obtenerMaintenanceStatus).mockResolvedValue(
      null as any
    );
  });

  it('renders campus users when Gitea fails without issuing a second Gitea directory request', async () => {
    vi.mocked(usuarioService.obtenerUsuariosAdmin).mockResolvedValue(
      pageWithUser('Ana', 'Gitea demoro demasiado en responder')
    );
    renderPage();

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Ana Alvarez')).toBeInTheDocument();
    expect(
      screen.getByText('Gitea demoro demasiado en responder')
    ).toBeInTheDocument();
    expect(
      within(table).getByText('Sin verificar en Gitea')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('No encontrada en Gitea')
    ).not.toBeInTheDocument();
    expect(usuarioService.obtenerUsuariosAdmin).toHaveBeenCalledTimes(1);
    expect(usuarioService.obtenerUsuariosGiteaAdmin).not.toHaveBeenCalled();
  });

  it('shows a loading state while the user table request is pending', async () => {
    let resolvePage: (page: AdminUsuariosPagina) => void;
    vi.mocked(usuarioService.obtenerUsuariosAdmin).mockReturnValue(
      new Promise(resolve => {
        resolvePage = resolve;
      })
    );
    renderPage();
    expect(await screen.findByText('Cargando usuarios...')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await act(async () => resolvePage!(pageWithUser()));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('shows the table error and allows retrying the failed request', async () => {
    vi.mocked(usuarioService.obtenerUsuariosAdmin)
      .mockRejectedValueOnce({ response: { status: 502 } })
      .mockResolvedValue(pageWithUser());
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los usuarios (HTTP 502)'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(usuarioService.obtenerUsuariosAdmin).toHaveBeenLastCalledWith(
      expect.objectContaining({ refreshGitea: true })
    );
  });

  it('refreshes the displayed user table when Consultar ahora is clicked', async () => {
    vi.mocked(usuarioService.obtenerUsuariosAdmin)
      .mockResolvedValueOnce(pageWithUser('Ana'))
      .mockResolvedValue(pageWithUser('Bea'));
    renderPage();
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: 'Consultar ahora' }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('table')).getByText('Bea Alvarez')
      ).toBeInTheDocument()
    );
    expect(usuarioService.obtenerUsuariosAdmin).toHaveBeenCalledTimes(2);
    expect(usuarioService.obtenerUsuariosAdmin).toHaveBeenLastCalledWith(
      expect.objectContaining({ refreshGitea: true })
    );
    expect(toast.success).toHaveBeenCalledWith('Usuarios actualizados');
  });

  it('ignores an older search response that arrives after a newer search', async () => {
    let resolveOldSearch: (page: AdminUsuariosPagina) => void;
    vi.mocked(usuarioService.obtenerUsuariosAdmin)
      .mockResolvedValueOnce(pageWithUser('Inicial'))
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveOldSearch = resolve;
        })
      )
      .mockResolvedValue(pageWithUser('Bea'));
    renderPage();
    await screen.findByRole('table');
    const search = screen.getByPlaceholderText(
      'Buscar por nombre, email o usuario de Gitea'
    );
    fireEvent.change(search, { target: { value: 'ana' } });
    await waitFor(() =>
      expect(usuarioService.obtenerUsuariosAdmin).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'ana' })
      )
    );
    fireEvent.change(search, { target: { value: 'bea' } });
    await waitFor(() =>
      expect(
        within(screen.getByRole('table')).getByText('Bea Alvarez')
      ).toBeInTheDocument()
    );
    await act(async () => resolveOldSearch!(pageWithUser('Ana')));
    expect(
      within(screen.getByRole('table')).getByText('Bea Alvarez')
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('table')).queryByText('Ana Alvarez')
    ).not.toBeInTheDocument();
  });
});
