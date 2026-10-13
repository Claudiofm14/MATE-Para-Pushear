import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AvanceCursadaPage from './page';
import {
  avanceService,
  MapaAvance,
  recalcularAvance,
} from '../../services/avance.service';
import { cursadaService } from '../../services/cursada.service';
import { usuarioService } from '../../services/usuario.service';

let canManage = false;
let previewSelection: {
  materiaId: number;
  cursadaId: number;
  comisionId: number;
  comisionNombre: string;
} | null = null;
const toastError = vi.fn();

vi.mock('../auth/contexts/AuthContext', () => ({
  useAuth: () => ({ authenticated: true, isInitialized: true }),
}));
vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    actualCanManageCurrentMateria: canManage,
    loadingPermissions: false,
  }),
}));
vi.mock('../../contexts/StudentPreviewContext', () => ({
  useStudentPreview: () => ({ selection: previewSelection }),
}));
vi.mock('../../hooks/useMateriaConfig', () => ({
  useMateriaConfig: () => ({ config: { pages: {} } }),
}));
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: toastError }),
}));
vi.mock('../../services/cursada.service', () => ({
  cursadaService: { getByMateria: vi.fn() },
}));
vi.mock('../../services/usuario.service', () => ({
  usuarioService: { obtenerMateriasAprobadas: vi.fn() },
}));
vi.mock('../../services/avance.service', async importOriginal => ({
  ...(await importOriginal<typeof import('../../services/avance.service')>()),
  avanceService: { obtener: vi.fn(), completar: vi.fn(), reiniciar: vi.fn() },
}));

function fixture(): MapaAvance {
  return recalcularAvance({
    materia: { id: 1, nombre: 'Materiales Tecnológicos', codigo: 'MAT-2026' },
    cursada: { id: 7, titulo: 'Cursada 2026' },
    comisionId: 5,
    simulacion: false,
    nodos: [
      {
        id: 1,
        titulo: 'Metales',
        semanaId: 101,
        numeroSemana: 1,
        requisitos: [],
      },
      {
        id: 2,
        titulo: 'Polímeros',
        semanaId: 101,
        numeroSemana: 1,
        requisitos: [],
      },
      {
        id: 3,
        titulo: 'Cerámicos',
        semanaId: 102,
        numeroSemana: 2,
        requisitos: [1],
      },
      {
        id: 4,
        titulo: 'Selección',
        semanaId: 102,
        numeroSemana: 2,
        requisitos: [2],
      },
      {
        id: 5,
        titulo: 'Parcial',
        semanaId: 103,
        numeroSemana: 3,
        requisitos: [3, 4],
      },
    ].map(nodo => ({
      ...nodo,
      descripcion: 'Descripción del trabajo',
      semanaTitulo: 'Materiales',
      fechaEntrega: '2026-10-20',
      estado: 'pendiente',
      completadoEn: null,
    })),
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/materia/1/avance']}>
      <Routes>
        <Route path="/materia/:id/avance" element={<AvanceCursadaPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  canManage = false;
  previewSelection = null;
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  vi.mocked(cursadaService.getByMateria).mockResolvedValue([
    { id: 7, materiaId: 1, activa: true, titulo: 'Cursada 2026' },
  ]);
  vi.mocked(usuarioService.obtenerMateriasAprobadas).mockResolvedValue([
    {
      id: 1,
      alumnoId: 10,
      materiaId: 1,
      comisionId: 5,
      estado: 'aprobado',
      fechaInscripcion: new Date(),
      comision: { cursada: { id: 7 } },
    },
  ]);
  vi.mocked(avanceService.obtener).mockResolvedValue(fixture());
});

describe('mapa de avance integrado', () => {
  it('guarda una entrega, recalcula progreso y habilita sólo la rama correspondiente', async () => {
    const user = userEvent.setup();
    const saved = fixture();
    saved.nodos[0].completadoEn = '2026-10-13T12:00:00Z';
    vi.mocked(avanceService.completar).mockResolvedValue(
      recalcularAvance(saved)
    );
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: 'Metales — Pendiente' })
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Descripción del trabajo')).toBeVisible();
    await user.click(
      within(dialog).getByRole('button', { name: 'Marcar como entregado' })
    );
    await waitFor(() =>
      expect(avanceService.completar).toHaveBeenCalledWith(7, 1)
    );
    expect(
      await screen.findByRole('button', { name: 'Metales — Entregado' })
    ).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '20');
    expect(
      screen.getByRole('button', { name: 'Cerámicos — Pendiente' })
    ).not.toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('button', { name: 'Selección — Bloqueado' })
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('un nodo bloqueado no abre el modal ni permite registrar una entrega', async () => {
    const user = userEvent.setup();
    renderPage();
    const locked = await screen.findByRole('button', {
      name: 'Cerámicos — Bloqueado',
    });
    expect(locked).toHaveAttribute('title', 'Completá primero: Metales');
    await user.click(locked);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(avanceService.completar).not.toHaveBeenCalled();
  });

  it('conserva el modal y el progreso si falla el guardado', async () => {
    const user = userEvent.setup();
    vi.mocked(avanceService.completar).mockRejectedValue(
      new Error('Sin conexión')
    );
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: 'Metales — Pendiente' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Marcar como entregado' })
    );
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0');
    expect(
      screen.getByRole('button', { name: 'Marcar como entregado' })
    ).toBeEnabled();
  });

  it('recupera el progreso guardado tras volver a entrar y confirma el reinicio', async () => {
    const user = userEvent.setup();
    const saved = fixture();
    saved.nodos[0].completadoEn = '2026-10-13T12:00:00Z';
    vi.mocked(avanceService.obtener).mockResolvedValue(recalcularAvance(saved));
    vi.mocked(avanceService.reiniciar).mockResolvedValue(fixture());
    renderPage();
    expect(
      await screen.findByRole('button', { name: 'Metales — Entregado' })
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: /^Reiniciar$/ }));
    expect(avanceService.reiniciar).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(avanceService.reiniciar).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /^Reiniciar$/ }));
    await user.click(screen.getByRole('button', { name: 'Reiniciar avance' }));
    await waitFor(() =>
      expect(avanceService.reiniciar).toHaveBeenCalledWith(7)
    );
    expect(
      await screen.findByRole('button', { name: 'Metales — Pendiente' })
    ).toBeVisible();
  });

  it('la simulación docente habilita actividades sin guardar entregas de alumnos', async () => {
    const user = userEvent.setup();
    canManage = true;
    previewSelection = {
      materiaId: 1,
      cursadaId: 7,
      comisionId: 5,
      comisionNombre: 'Comisión A',
    };
    vi.mocked(avanceService.obtener).mockResolvedValue({
      ...fixture(),
      simulacion: true,
    });
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: 'Metales — Pendiente' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Marcar como entregado' })
    );
    expect(
      await screen.findByRole('button', { name: 'Cerámicos — Pendiente' })
    ).toBeVisible();
    expect(avanceService.obtener).toHaveBeenCalledWith(7, 5);
    expect(avanceService.completar).not.toHaveBeenCalled();
    expect(usuarioService.obtenerMateriasAprobadas).not.toHaveBeenCalled();
  });

  it('usa una cursada aprobada aunque haya otra activa y muestra recorridos vacíos', async () => {
    vi.mocked(cursadaService.getByMateria).mockResolvedValue([
      { id: 8, materiaId: 1, activa: true, titulo: 'Otra cursada' },
      { id: 7, materiaId: 1, activa: false, titulo: 'Mi cursada' },
    ]);
    vi.mocked(avanceService.obtener).mockResolvedValue({
      ...fixture(),
      nodos: [],
    });
    renderPage();
    expect(
      await screen.findByText('Todavía no hay actividades disponibles')
    ).toBeVisible();
    expect(avanceService.obtener).toHaveBeenCalledWith(7, undefined);
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0');
  });

  it('ofrece reintentar después de un error sin entrar en un bucle de peticiones', async () => {
    const user = userEvent.setup();
    vi.mocked(avanceService.obtener)
      .mockRejectedValueOnce(new Error('Sin conexión'))
      .mockResolvedValue(fixture());
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: 'Intentar de nuevo' })
    );
    expect(
      await screen.findByRole('heading', { name: 'Avance de Cursada' })
    ).toBeVisible();
    expect(avanceService.obtener).toHaveBeenCalledTimes(2);
  });

  it('el zoom respeta sus límites y Escape cierra los detalles', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: 'Avance de Cursada' });
    const zoom = screen.getByRole('button', {
      name: 'Restablecer zoom al 75%',
    });
    await user.click(screen.getByRole('button', { name: 'Acercar mapa' }));
    expect(zoom).toHaveTextContent('88%');
    for (let i = 0; i < 10; i++)
      await user.click(screen.getByRole('button', { name: 'Alejar mapa' }));
    expect(zoom).toHaveTextContent('50%');
    expect(screen.getByRole('button', { name: 'Alejar mapa' })).toBeDisabled();
    await user.click(zoom);
    expect(zoom).toHaveTextContent('75%');
    await user.click(
      screen.getByRole('button', { name: 'Metales — Pendiente' })
    );
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { bubbles: true, cancelable: true })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
