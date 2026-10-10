import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoCollection } from './VideoCollection';
import { Video, YoutubePlaylistVideos } from '../services/video.service';
import { VideoCard } from '../app/semanas/[id]/components/VideoCard';

const mocks = vi.hoisted(() => ({ getPlaylistVideos: vi.fn() }));
vi.mock('../services/video.service', () => ({ videoService: mocks }));

const playlistId = 'PLBC5Xu0KKOJM-OKZD7d8SiYMo3L0PEGwR';
const playlist: Video = {
  id: 7,
  titulo: 'Resumen de API',
  url: `https://youtube.com/playlist?list=${playlistId}`,
  semanaId: 3,
};
const data: YoutubePlaylistVideos = {
  playlistId,
  videos: Array.from({ length: 8 }, (_, i) => ({
    playlistItemId: `item-${i}`,
    videoId: String(i).padStart(11, '0'),
    titulo: `Parte ${i + 1}`,
    url: `https://www.youtube.com/watch?v=${String(i).padStart(11, '0')}`,
    orden: i + 1,
  })),
};

function renderVideo(video: Video, isPlaylistItem: boolean) {
  return (
    <VideoCard
      video={video}
      canEdit={!isPlaylistItem}
      canDelete={!isPlaylistItem}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPlaylistVideos.mockResolvedValue(data);
});

describe('VideoCollection', () => {
  it('muestra todos los videos en orden, con miniaturas y reproducción individual', async () => {
    const { container } = render(
      <VideoCollection video={playlist} renderVideo={renderVideo} />
    );
    await screen.findByText('8 videos');
    expect(
      screen.getAllByRole('heading', { level: 3 }).map(node => node.textContent)
    ).toEqual(['Resumen de API', ...data.videos.map(video => video.titulo)]);
    expect(container.querySelectorAll('img')).toHaveLength(8);
    expect(container.querySelectorAll('iframe')).toHaveLength(0);
    expect(mocks.getPlaylistVideos).toHaveBeenCalledWith(
      7,
      expect.any(AbortSignal)
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Reproducir Parte 3' })
    );
    expect(screen.getByTitle('Parte 3')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/00000000002?rel=0&autoplay=1'
    );
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
  });

  it('aplica editar y eliminar a la playlist completa', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <VideoCollection
        video={playlist}
        onEdit={onEdit}
        onDelete={onDelete}
        renderVideo={renderVideo}
      />
    );
    await screen.findByText('8 videos');
    expect(
      screen.queryByRole('button', { name: 'Editar video Parte 1' })
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar playlist Resumen de API' })
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Eliminar playlist Resumen de API' })
    );
    expect(onEdit).toHaveBeenCalledWith(playlist);
    expect(onDelete).toHaveBeenCalledWith(playlist);
  });

  it('mantiene el reproductor de playlist disponible si falla la consulta y permite reintentar', async () => {
    mocks.getPlaylistVideos.mockRejectedValueOnce(new Error('Unavailable'));
    render(<VideoCollection video={playlist} renderVideo={renderVideo} />);
    await screen.findByRole('alert');
    await userEvent.click(
      screen.getByRole('button', { name: 'Reproducir Resumen de API' })
    );
    expect(screen.getByTitle('Resumen de API')).toHaveAttribute(
      'src',
      expect.stringContaining(`list=${playlistId}`)
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText('8 videos');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('no consulta YouTube para videos individuales', () => {
    render(
      <VideoCollection
        video={{ ...playlist, url: 'https://youtu.be/dQw4w9WgXcQ' }}
        renderVideo={renderVideo}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Reproducir Resumen de API' })
    ).toBeInTheDocument();
    expect(mocks.getPlaylistVideos).not.toHaveBeenCalled();
  });

  it('informa cuando una playlist no tiene videos disponibles', async () => {
    mocks.getPlaylistVideos.mockResolvedValueOnce({ playlistId, videos: [] });
    render(<VideoCollection video={playlist} renderVideo={renderVideo} />);
    expect(
      await screen.findByText(
        'No hay videos públicos disponibles en esta playlist.'
      )
    ).toBeInTheDocument();
  });

  it('descarta respuestas anteriores cuando se cambia el enlace de la playlist', async () => {
    let resolveOld: (value: YoutubePlaylistVideos) => void = () => {};
    mocks.getPlaylistVideos.mockReturnValueOnce(
      new Promise<YoutubePlaylistVideos>(resolve => {
        resolveOld = resolve;
      })
    );
    const { rerender } = render(
      <VideoCollection video={playlist} renderVideo={renderVideo} />
    );
    const oldSignal = mocks.getPlaylistVideos.mock.calls[0][1] as AbortSignal;
    const newData = {
      playlistId: 'PL-new',
      videos: [{ ...data.videos[0], titulo: 'Video nuevo' }],
    };
    mocks.getPlaylistVideos.mockResolvedValueOnce(newData);
    rerender(
      <VideoCollection
        video={{ ...playlist, url: 'https://youtube.com/playlist?list=PL-new' }}
        renderVideo={renderVideo}
      />
    );
    await screen.findByText('Video nuevo');
    expect(oldSignal.aborted).toBe(true);
    await act(async () => resolveOld(data));
    await waitFor(() =>
      expect(screen.queryByText('Parte 1')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Video nuevo')).toBeInTheDocument();
  });
});
