import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CronogramaPage from './page';
import { cronogramaService } from '../../services/cronograma.service';
import { cursadaService } from '../../services/cursada.service';
import { comisionService } from '../../services/comision.service';

const permissionState = {
  canManageCurrentMateria: true,
  loadingPermissions: false,
};
const toast = { success: vi.fn(), error: vi.fn() };

vi.mock('react-router-dom', () => ({ useParams: () => ({ id: '4' }) }));
vi.mock('../../components/MateriaAccessGuard', () => ({
  MateriaAccessGuard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../../hooks', () => ({
  usePermissions: () => permissionState,
  useMateriaConfig: () => ({
    config: {
      pages: {
        cronograma: {
          titulo: 'Agenda de clases',
          descripcion: 'Descripción configurable',
        },
      },
    },
  }),
  useToast: () => toast,
}));
vi.mock('../../services/cronograma.service', () => ({
  cronogramaService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));
vi.mock('../../services/cursada.service', () => ({
  cursadaService: { getByMateria: vi.fn() },
}));
vi.mock('../../services/comision.service', () => ({
  comisionService: { getByCursada: vi.fn() },
}));

const activeCourse = {
  id: 7,
  titulo: 'Cursada 2026',
  activa: true,
  materiaId: 4,
};
const commission = { id: 2, nombre: 'Comisión Real', cursadaId: 7 };
const row = {
  id: 10,
  cursadaId: 7,
  numeroSemana: 3,
  fecha: '2026-08-22',
  hora: '10:00',
  actividades: 'Laboratorio',
  temas: 'Transacciones',
  tareas: 'Guía',
  comisiones: [
    { comisionId: 2, modalidad: 'virtual' as const, comision: commission },
  ],
};

describe('CronogramaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionState.canManageCurrentMateria = true;
    vi.mocked(comisionService.getByCursada).mockResolvedValue([commission]);
    vi.mocked(cronogramaService.list).mockResolvedValue([]);
  });

  it('muestra el estado sin cursada activa', async () => {
    vi.mocked(cursadaService.getByMateria).mockResolvedValue([]);
    render(<CronogramaPage />);
    expect(
      await screen.findByText('No existe una cursada activa')
    ).toBeInTheDocument();
    expect(screen.queryByText('Agregar fila')).not.toBeInTheDocument();
  });

  it('muestra configuración, tabla, filtro y permite abrir/cancelar el alta', async () => {
    vi.mocked(cursadaService.getByMateria).mockResolvedValue([activeCourse]);
    vi.mocked(cronogramaService.list).mockResolvedValue([row]);
    render(<CronogramaPage />);
    expect(await screen.findByText('Agenda de clases')).toBeInTheDocument();
    // La fila se renderiza dos veces (tarjeta mobile + tabla desktop, cada
    // una visible en su breakpoint vía CSS); jsdom no aplica media queries,
    // asi que hay que acotar las queries a la tabla para no chocar con el
    // duplicado de la tarjeta.
    const table = screen.getByRole('table');
    expect(within(table).getByText('Laboratorio')).toBeInTheDocument();
    expect(within(table).getByText('3')).toBeInTheDocument();
    expect(within(table).getByText('22/8/2026')).toBeInTheDocument();
    expect(within(table).getByLabelText('Editar semana 3')).toBeVisible();
    expect(within(table).getByLabelText('Eliminar semana 3')).toBeVisible();
    expect(within(table).getByLabelText('Duplicar semana 3')).toBeVisible();
    fireEvent.click(screen.getByLabelText('Filtrar por comisión'));
    expect(screen.getByRole('option', { name: 'Comisión Real' })).toBeVisible();
    fireEvent.click(screen.getByText('Agregar fila'));
    const checkbox = screen.getByLabelText('Seleccionar Comisión Real');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByLabelText('Modalidad de Comisión Real'));
    expect(screen.getByRole('option', { name: 'Virtual' })).toBeVisible();
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() =>
      expect(
        screen.queryByLabelText('Seleccionar Comisión Real')
      ).not.toBeInTheDocument()
    );
  });

  it('duplica una fila conservando contenidos, comisiones y modalidad', async () => {
    vi.mocked(cursadaService.getByMateria).mockResolvedValue([activeCourse]);
    vi.mocked(cronogramaService.list).mockResolvedValue([row]);
    vi.mocked(cronogramaService.create).mockResolvedValue({
      ...row,
      id: 11,
    });
    render(<CronogramaPage />);
    const table = await screen.findByRole('table');
    fireEvent.click(within(table).getByLabelText('Duplicar semana 3'));
    await waitFor(() =>
      expect(cronogramaService.create).toHaveBeenCalledWith(7, {
        numeroSemana: 3,
        fecha: '2026-08-22',
        hora: '10:00',
        actividades: 'Laboratorio',
        temas: 'Transacciones',
        tareas: 'Guía',
        comisiones: [{ comisionId: 2, modalidad: 'virtual' }],
      })
    );
    expect(toast.success).toHaveBeenCalledWith('Fila duplicada correctamente');
  });

  it('muestra una confirmación descriptiva antes de eliminar', async () => {
    vi.mocked(cursadaService.getByMateria).mockResolvedValue([activeCourse]);
    vi.mocked(cronogramaService.list).mockResolvedValue([row]);
    vi.mocked(cronogramaService.remove).mockResolvedValue(undefined);
    render(<CronogramaPage />);
    const table = await screen.findByRole('table');
    fireEvent.click(within(table).getByLabelText('Eliminar semana 3'));
    expect(
      screen.getByRole('alertdialog', {
        name: '¿Eliminar esta fila del cronograma?',
      })
    ).toBeVisible();
    expect(
      screen.getByText(
        'Vas a eliminar la fila de la semana 3, correspondiente al 22/8/2026. Esta acción no se puede deshacer.'
      )
    ).toBeVisible();
    fireEvent.click(screen.getByText('Sí, eliminar fila'));
    await waitFor(() =>
      expect(cronogramaService.remove).toHaveBeenCalledWith(10)
    );
  });

  it('limita la visualización del alumno y no ofrece acciones', async () => {
    permissionState.canManageCurrentMateria = false;
    vi.mocked(cursadaService.getByMateria).mockResolvedValue([activeCourse]);
    vi.mocked(cronogramaService.list).mockResolvedValue([row]);
    render(<CronogramaPage />);
    expect(
      await screen.findByText('Comisión visualizada: tu comisión asignada')
    ).toBeInTheDocument();
    expect(screen.queryByText('Agregar fila')).not.toBeInTheDocument();
    expect(screen.queryByText('Acciones')).not.toBeInTheDocument();
    expect(comisionService.getByCursada).not.toHaveBeenCalled();
  });
});
