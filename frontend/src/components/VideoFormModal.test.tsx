import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoFormModal } from './VideoFormModal';
import { Semana } from '../services/semana.service';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  getSemanas: vi.fn(),
  getSemana: vi.fn(),
  getSemanasPorCursada: vi.fn(),
  getCursadas: vi.fn(),
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../services', () => ({
  videoService: { create: mocks.create, update: mocks.update },
}));
vi.mock('../services/semana.service', () => ({
  semanaService: {
    getAll: mocks.getSemanas,
    getById: mocks.getSemana,
    getByCursada: mocks.getSemanasPorCursada,
  },
}));
vi.mock('../services/cursada.service', () => ({
  cursadaService: { getByMateria: mocks.getCursadas },
}));
vi.mock('../hooks', () => ({ useToast: () => mocks.toast }));

const playlistId = 'PLBC5Xu0KKOJM-OKZD7d8SiYMo3L0PEGwR';
const playlistUrl = `https://youtube.com/playlist?list=${playlistId}`;
const semana: Semana = {
  id: 7,
  titulo: 'Semana 7',
  numeroSemana: 7,
  fechaInicio: '2026-10-07',
  cursadaId: 42,
  cursada: { id: 42, titulo: 'Cursada actual', materiaId: 9 },
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSemanas.mockResolvedValue([semana]);
  mocks.getSemana.mockResolvedValue(semana);
  mocks.getSemanasPorCursada.mockResolvedValue([semana]);
  mocks.getCursadas.mockResolvedValue([{ id: 42, materiaId: 9, activa: true }]);
  mocks.create.mockResolvedValue({ id: 1 });
  mocks.update.mockResolvedValue({ id: 1 });
});

describe('VideoFormModal', () => {
  it('muestra solo semanas de la cursada actual y excluye eliminadas y otras materias', async () => {
    mocks.getSemanasPorCursada.mockResolvedValue([
      semana,
      { ...semana, id: 8, titulo: 'Semana eliminada', deletedAt: '2026-10-06' },
      {
        ...semana,
        id: 9,
        titulo: 'Otra cursada',
        cursadaId: 99,
        cursada: { id: 99, materiaId: 9 },
      },
      {
        ...semana,
        id: 10,
        titulo: 'Otra materia',
        cursada: { id: 42, materiaId: 88 },
      },
      {
        ...semana,
        id: 11,
        titulo: 'Cursada eliminada',
        cursada: { id: 42, materiaId: 9, deletedAt: '2026-10-06' },
      },
    ]);
    render(
      <VideoFormModal
        isOpen
        semanaId={7}
        cursadaId={42}
        materiaId={9}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('option', { name: /Semana 7/ });
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByLabelText(/Ubicación/)).toHaveValue('7');
    expect(mocks.getSemanasPorCursada).toHaveBeenCalledWith(42);
    expect(mocks.getSemanas).not.toHaveBeenCalled();
    expect(mocks.getCursadas).not.toHaveBeenCalled();
  });

  it('resuelve la cursada desde la semana si no recibe materia ni cursada', async () => {
    render(
      <VideoFormModal
        isOpen
        semanaId={7}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('option', { name: /Semana 7/ });
    expect(mocks.getSemana).toHaveBeenCalledWith(7);
    expect(mocks.getSemanasPorCursada).toHaveBeenCalledWith(42);
    expect(mocks.getSemanas).not.toHaveBeenCalled();
  });

  it('consulta solo cursadas de la materia que no estén eliminadas', async () => {
    mocks.getCursadas.mockResolvedValue([
      { id: 42, materiaId: 9 },
      { id: 43, materiaId: 9, deletedAt: '2026-10-06' },
      { id: 44, materiaId: 88 },
    ]);
    render(
      <VideoFormModal
        isOpen
        materiaId={9}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('option', { name: /Semana 7/ });
    expect(mocks.getCursadas).toHaveBeenCalledWith(9);
    expect(mocks.getSemanasPorCursada).toHaveBeenCalledTimes(1);
    expect(mocks.getSemanasPorCursada).toHaveBeenCalledWith(42);
    expect(screen.getByLabelText(/Ubicación/)).toHaveValue('0');
  });

  it('permite elegir General sin volver a seleccionar una semana automáticamente', async () => {
    render(
      <VideoFormModal
        isOpen
        semanaId={7}
        cursadaId={42}
        materiaId={9}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('option', { name: /Semana 7/ });
    await userEvent.selectOptions(screen.getByLabelText(/Ubicación/), '0');
    fireEvent.change(screen.getByLabelText(/Título del video o playlist/), {
      target: { value: 'Video general' },
    });
    fireEvent.change(screen.getByLabelText(/URL de YouTube/), {
      target: { value: 'https://youtu.be/dQw4w9WgXcQ' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Crear video o playlist' })
    );
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({ materiaId: 9, semanaId: undefined })
      )
    );
    expect(screen.getByLabelText(/Ubicación/)).toHaveValue('0');
    expect(mocks.getSemanasPorCursada).toHaveBeenCalledTimes(1);
  });

  it('conserva la ubicación del video cuando la API devuelve la relación semana', async () => {
    render(
      <VideoFormModal
        isOpen
        materiaId={9}
        video={{
          id: 3,
          titulo: 'Video existente',
          url: playlistUrl,
          semana: { id: 7, cursadaId: 42 },
        }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('option', { name: /Semana 7/ });
    expect(screen.getByLabelText(/Ubicación/)).toHaveValue('7');
    expect(mocks.getSemana).toHaveBeenCalledWith(7);
    expect(mocks.getSemanas).not.toHaveBeenCalled();
  });

  it('impide guardar en una semana eliminada o ajena al contexto', async () => {
    render(
      <VideoFormModal
        isOpen
        semanaId={99}
        cursadaId={42}
        materiaId={9}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('option', { name: /Semana 7/ });
    fireEvent.change(screen.getByLabelText(/Título del video o playlist/), {
      target: { value: 'Video' },
    });
    fireEvent.change(screen.getByLabelText(/URL de YouTube/), {
      target: { value: playlistUrl },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Crear video o playlist' })
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Seleccioná una semana disponible de esta cursada.'
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('descarta las respuestas anteriores al cambiar de cursada', async () => {
    let resolveOld: (value: Semana[]) => void = () => {};
    mocks.getSemanasPorCursada.mockReturnValueOnce(
      new Promise<Semana[]>(resolve => {
        resolveOld = resolve;
      })
    );
    const { rerender } = render(
      <VideoFormModal
        isOpen
        cursadaId={42}
        materiaId={9}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    const newWeek = {
      ...semana,
      id: 20,
      titulo: 'Semana nueva',
      numeroSemana: 8,
      cursadaId: 77,
      cursada: { id: 77, materiaId: 9 },
    };
    mocks.getSemanasPorCursada.mockResolvedValueOnce([newWeek]);
    rerender(
      <VideoFormModal
        isOpen
        cursadaId={77}
        materiaId={9}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('option', { name: /Semana nueva/ });
    await act(async () => resolveOld([semana]));
    expect(
      screen.queryByRole('option', { name: /Semana 7/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /Semana nueva/ })
    ).toBeInTheDocument();
  });

  it('no consulta el listado global si falta el contexto del video', async () => {
    render(<VideoFormModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);
    await screen.findByRole('alert');
    expect(mocks.getSemanas).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Crear video o playlist' })
    ).toBeDisabled();
  });

  it('no ofrece una semana eliminada al resolver el contexto por su ID', async () => {
    mocks.getSemana.mockResolvedValueOnce({
      ...semana,
      deletedAt: '2026-10-06',
    });
    render(
      <VideoFormModal
        isOpen
        semanaId={7}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('alert');
    expect(mocks.getSemanasPorCursada).not.toHaveBeenCalled();
    expect(mocks.getSemanas).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('option', { name: /Semana 7/ })
    ).not.toBeInTheDocument();
  });

  it('vacía las opciones anteriores si falla la carga de otra cursada', async () => {
    const { rerender } = render(
      <VideoFormModal
        isOpen
        cursadaId={42}
        materiaId={9}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('option', { name: /Semana 7/ });
    mocks.getSemanasPorCursada.mockRejectedValueOnce(
      new Error('Network error')
    );
    rerender(
      <VideoFormModal
        isOpen
        cursadaId={77}
        materiaId={9}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    await screen.findByRole('alert');
    expect(
      screen.queryByRole('option', { name: /Semana 7/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Crear video o playlist' })
    ).toBeDisabled();
  });

  it('previsualiza y guarda una playlist normalizada asociada a la semana', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(
      <VideoFormModal
        isOpen
        semanaId={7}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    await screen.findByRole('option', { name: /Semana 7/ });
    fireEvent.change(screen.getByLabelText(/Título del video o playlist/), {
      target: { value: 'Playlist de la semana' },
    });
    fireEvent.change(screen.getByLabelText(/URL de YouTube/), {
      target: { value: `  youtube.com/playlist?list=${playlistId}  ` },
    });

    const preview = screen.getByTitle('Vista previa del video o playlist');
    expect(preview).toHaveAttribute(
      'src',
      `https://www.youtube.com/embed?listType=playlist&list=${playlistId}&rel=0`
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Crear video o playlist' })
    );

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Playlist de la semana',
          url: playlistUrl,
          semanaId: 7,
        })
      )
    );
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('permite reemplazar un video existente por una playlist', async () => {
    render(
      <VideoFormModal
        isOpen
        video={{
          id: 3,
          titulo: 'Material de la semana',
          url: 'https://youtu.be/dQw4w9WgXcQ',
          semanaId: 7,
        }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await screen.findByRole('option', { name: /Semana 7/ });
    fireEvent.change(screen.getByLabelText(/URL de YouTube/), {
      target: { value: playlistUrl },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Actualizar video o playlist' })
    );

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ url: playlistUrl, semanaId: 7 })
      )
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('impide guardar enlaces de otros sitios aunque incluyan list', async () => {
    render(
      <VideoFormModal
        isOpen
        semanaId={7}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await screen.findByRole('option', { name: /Semana 7/ });
    fireEvent.change(screen.getByLabelText(/Título del video o playlist/), {
      target: { value: 'Playlist inválida' },
    });
    fireEvent.change(screen.getByLabelText(/URL de YouTube/), {
      target: { value: `https://ejemplo.test/playlist?list=${playlistId}` },
    });
    expect(
      screen.queryByTitle('Vista previa del video o playlist')
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Crear video o playlist' })
    );

    expect(
      screen.getByText(
        'Ingresá una URL válida de un video o playlist de YouTube'
      )
    ).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
