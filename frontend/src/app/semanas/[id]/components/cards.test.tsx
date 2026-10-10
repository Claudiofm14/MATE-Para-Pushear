import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseCard } from './ExerciseCard';
import { HorarioCard } from './HorarioCard';
import { VideoCard, getYoutubeId, toEmbedUrl } from './VideoCard';
import { Ejercicio, Horario, TipoHorario, Video } from '../../../../services';

vi.mock('../../../../hooks', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn() }),
}));

const ejercicioService = vi.hoisted(() => ({
  getStudentRepo: vi.fn(),
  ensureStudentRepo: vi.fn(),
  getTeacherRepo: vi.fn(),
  ensureTeacherRepo: vi.fn(),
  listGroups: vi.fn(),
  myGroup: vi.fn(),
}));

vi.mock('../../../../services', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../services')>();
  return { ...actual, ejercicioService };
});

const baseEjercicio: Ejercicio = {
  id: 1,
  titulo: 'Trabajo práctico 1',
  descripcion: 'Resolver los ejercicios de la guía.',
};

beforeEach(() => {
  vi.clearAllMocks();
  ejercicioService.getStudentRepo.mockResolvedValue(null);
  ejercicioService.getTeacherRepo.mockResolvedValue(null);
  ejercicioService.listGroups.mockResolvedValue([]);
  ejercicioService.myGroup.mockResolvedValue(null);
});

describe('ExerciseCard', () => {
  const noop = () => undefined;

  it('muestra los enlaces cargados y las acciones de docente', () => {
    render(
      <ExerciseCard
        ejercicio={{
          ...baseEjercicio,
          tipoActividad: 'enlace',
          recursoUrl: 'https://ejemplo.test/guia',
          readmeUrl: 'https://ejemplo.test/readme',
          repositorioEjemplo: 'https://ejemplo.test/ejemplo',
          classroomUrl: 'https://ejemplo.test/classroom',
        }}
        canEdit
        canDelete
        onEdit={noop}
        onDelete={noop}
      />
    );

    expect(screen.getByText('Trabajo práctico 1')).toBeInTheDocument();
    expect(screen.getByTitle('Abrir enlace')).toHaveAttribute(
      'href',
      'https://ejemplo.test/guia'
    );
    expect(screen.getByTitle('Instrucciones')).toBeInTheDocument();
    expect(screen.getByTitle('Ver ejemplo')).toBeInTheDocument();
    expect(screen.getByTitle('Abrir asignacion')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Editar ejercicio Trabajo práctico 1')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Eliminar ejercicio Trabajo práctico 1')
    ).toBeInTheDocument();
  });

  it('avisa cuando la actividad no tiene enlaces', () => {
    render(
      <ExerciseCard
        ejercicio={{ ...baseEjercicio, tipoActividad: 'instrucciones' }}
        canEdit={false}
        canDelete={false}
        onEdit={noop}
        onDelete={noop}
      />
    );

    expect(
      screen.getByText('La consigna está en la descripción.')
    ).toBeInTheDocument();
  });

  it('traduce la fecha de entrega a lenguaje relativo', () => {
    const hoy = new Date();
    const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    render(
      <ExerciseCard
        ejercicio={{ ...baseEjercicio, fechaEntrega: iso }}
        canEdit={false}
        canDelete={false}
        onEdit={noop}
        onDelete={noop}
      />
    );

    expect(screen.getByText('Vence hoy')).toBeInTheDocument();
  });

  it('ofrece crear el repositorio al alumno cuando hay plantilla Gitea', async () => {
    render(
      <ExerciseCard
        ejercicio={{
          ...baseEjercicio,
          tipoActividad: 'programacion',
          giteaAutoCreateRepo: true,
        }}
        canEdit={false}
        canDelete={false}
        onEdit={noop}
        onDelete={noop}
      />
    );

    await waitFor(() =>
      expect(ejercicioService.getStudentRepo).toHaveBeenCalledWith(1)
    );
    expect(await screen.findByText('Crear mi repositorio')).toBeInTheDocument();
  });

  it('representa la acción sin consultar ni crear repositorios en la vista previa', () => {
    render(
      <ExerciseCard
        ejercicio={{
          ...baseEjercicio,
          tipoActividad: 'programacion',
          giteaAutoCreateRepo: true,
        }}
        canEdit={false}
        canDelete={false}
        isStudentPreview
        onEdit={noop}
        onDelete={noop}
      />
    );

    expect(
      screen.getByText('El alumno puede preparar su repositorio desde aquí')
    ).toBeInTheDocument();
    expect(ejercicioService.getStudentRepo).not.toHaveBeenCalled();
    expect(ejercicioService.listGroups).not.toHaveBeenCalled();
  });

  it('ofrece al docente la plantilla y su copia para resolver', async () => {
    render(
      <ExerciseCard
        ejercicio={{
          ...baseEjercicio,
          tipoActividad: 'programacion',
          giteaAutoCreateRepo: true,
          giteaTemplateCloneUrl: 'https://gitea.test/catedra/tp1.git',
        }}
        canEdit
        canDelete
        onEdit={noop}
        onDelete={noop}
      />
    );

    expect(
      screen.getByTitle('Repositorio plantilla del ejercicio')
    ).toHaveAttribute('href', 'https://gitea.test/catedra/tp1');
    expect(
      await screen.findByText('Crear mi copia para resolver')
    ).toBeInTheDocument();
  });

  it('muestra el panel grupal cuando la asignación es en grupo', async () => {
    render(
      <ExerciseCard
        ejercicio={{
          ...baseEjercicio,
          tipoActividad: 'programacion',
          giteaAutoCreateRepo: true,
          assignmentMode: 'group',
          allowStudentGroupCreation: true,
        }}
        canEdit={false}
        canDelete={false}
        onEdit={noop}
        onDelete={noop}
      />
    );

    expect(screen.getByText('Grupal')).toBeInTheDocument();
    expect(await screen.findByText('Crear grupo')).toBeInTheDocument();
    expect(ejercicioService.getStudentRepo).not.toHaveBeenCalled();
  });
});

describe('HorarioCard', () => {
  const horario: Horario = {
    id: 7,
    titulo: 'Clase teórica',
    tipo: TipoHorario.VIRTUAL,
    detalle: 'Miércoles 18 a 20 h',
    url: 'https://meet.google.com/abc-defg-hij',
  };

  it('identifica la plataforma del encuentro virtual', () => {
    render(
      <HorarioCard
        horario={horario}
        canEdit={false}
        canDelete={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />
    );

    expect(screen.getByText('Virtual')).toBeInTheDocument();
    expect(screen.getByText('Unirse a la clase')).toBeInTheDocument();
    expect(screen.getByText('Google Meet')).toBeInTheDocument();
  });

  it('dispara las acciones de docente', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <HorarioCard
        horario={{ ...horario, tipo: TipoHorario.PRESENCIAL }}
        canEdit
        canDelete
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Presencial')).toBeInTheDocument();
    await userEvent.click(
      screen.getByLabelText('Editar horario Clase teórica')
    );
    await userEvent.click(
      screen.getByLabelText('Eliminar horario Clase teórica')
    );

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });

  it('permite cambiar la posición solo cuando corresponde', async () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <HorarioCard
        horario={horario}
        canEdit
        canDelete={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
        position={1}
        total={3}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    );

    expect(screen.getByText('Posición 2 de 3')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /mover .* antes/i })
    );
    await userEvent.click(
      screen.getByRole('button', { name: /mover .* después/i })
    );

    expect(onMoveUp).toHaveBeenCalledOnce();
    expect(onMoveDown).toHaveBeenCalledOnce();
  });
});

describe('VideoCard', () => {
  const video: Video = {
    id: 3,
    titulo: 'Introducción a TypeScript',
    subtitulo: 'Clase 1',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  };

  it('extrae el id de YouTube de todos sus formatos de URL', () => {
    expect(getYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(getYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ'
    );
    expect(getYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ'
    );
    expect(getYoutubeId('https://ejemplo.test/video.mp4')).toBeNull();
    expect(toEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'
    );
  });

  it('no monta el iframe hasta que se pulsa reproducir', async () => {
    const { container } = render(
      <VideoCard
        video={video}
        canEdit={false}
        canDelete={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />
    );

    expect(container.querySelector('iframe')).toBeNull();

    await userEvent.click(
      screen.getByLabelText('Reproducir Introducción a TypeScript')
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toContain('autoplay=1');
  });

  it('reproduce una playlist completa al pulsar play y mantiene su enlace original', async () => {
    const playlistId = 'PLBC5Xu0KKOJM-OKZD7d8SiYMo3L0PEGwR';
    const playlist = {
      ...video,
      titulo: 'Playlist de la semana',
      url: `https://youtube.com/playlist?list=${playlistId}`,
    };
    const { container } = render(
      <VideoCard
        video={playlist}
        canEdit={false}
        canDelete={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />
    );

    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Ver playlist en YouTube' })
    ).toHaveAttribute('href', playlist.url);

    await userEvent.click(
      screen.getByRole('button', { name: 'Reproducir Playlist de la semana' })
    );

    const embed = new URL(
      screen.getByTitle(playlist.titulo).getAttribute('src')!
    );
    expect(embed.pathname).toBe('/embed');
    expect(embed.searchParams.get('listType')).toBe('playlist');
    expect(embed.searchParams.get('list')).toBe(playlistId);
    expect(embed.searchParams.get('autoplay')).toBe('1');
  });

  it('mantiene el enlace al video original', () => {
    render(
      <VideoCard
        video={video}
        canEdit={false}
        canDelete={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />
    );

    expect(screen.getByText('Ver en YouTube').closest('a')).toHaveAttribute(
      'href',
      video.url
    );
  });
});
