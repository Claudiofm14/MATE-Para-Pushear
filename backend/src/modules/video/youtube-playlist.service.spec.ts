import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { YoutubePlaylistService } from './youtube-playlist.service';

const playlistId = 'PLBC5Xu0KKOJM-OKZD7d8SiYMo3L0PEGwR';
const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

function item(position: number, title = `Video ${position + 1}`) {
  return {
    id: `item-${position}`,
    snippet: {
      title,
      position,
      resourceId: { videoId: String(position).padStart(11, '0') },
    },
    status: { privacyStatus: 'public' },
  };
}

function response(items: ReturnType<typeof item>[], nextPageToken?: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ items, nextPageToken }),
  } as Response;
}

describe('YoutubePlaylistService', () => {
  let fetchMock: jest.SpyInstance;
  let config: { get: jest.Mock };
  let service: YoutubePlaylistService;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
    config = { get: jest.fn().mockReturnValue('test-server-key') };
    service = new YoutubePlaylistService(config as unknown as ConfigService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('devuelve una entrada por video con su título y enlace individual', async () => {
    fetchMock.mockResolvedValue(
      response(Array.from({ length: 8 }, (_, i) => item(i))),
    );

    const result = await service.getVideos(playlistUrl);

    expect(result.playlistId).toBe(playlistId);
    expect(result.videos).toHaveLength(8);
    expect(result.videos[0]).toEqual({
      playlistItemId: 'item-0',
      videoId: '00000000000',
      titulo: 'Video 1',
      url: 'https://www.youtube.com/watch?v=00000000000',
      orden: 1,
    });
  });

  it('recupera todas las páginas, conserva el orden y reutiliza la consulta', async () => {
    fetchMock
      .mockResolvedValueOnce(response([item(1), item(0)], 'next-page'))
      .mockResolvedValueOnce(response([item(2)]));

    const result = await service.getVideos(playlistUrl);
    expect(result.videos.map((video) => video.orden)).toEqual([1, 2, 3]);
    const firstUrl = new URL(fetchMock.mock.calls[0][0]);
    const nextUrl = new URL(fetchMock.mock.calls[1][0]);
    expect(firstUrl.searchParams.get('maxResults')).toBe('50');
    expect(nextUrl.searchParams.get('pageToken')).toBe('next-page');
    expect(nextUrl.searchParams.get('playlistId')).toBe(playlistId);

    await expect(service.getVideos(playlistUrl)).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('omite videos privados y eliminados', async () => {
    const privateItem = item(3);
    privateItem.status.privacyStatus = 'private';
    fetchMock.mockResolvedValue(
      response([
        item(0),
        item(1, 'Deleted video'),
        item(2, 'Private video'),
        privateItem,
      ]),
    );
    await expect(service.getVideos(playlistUrl)).resolves.toMatchObject({
      videos: [expect.objectContaining({ titulo: 'Video 1' })],
    });
  });

  it('conserva dos posiciones cuando el mismo video aparece más de una vez', async () => {
    const repeat = item(1);
    repeat.snippet.resourceId.videoId = item(0).snippet.resourceId.videoId;
    fetchMock.mockResolvedValue(response([item(0), repeat]));
    const result = await service.getVideos(playlistUrl);
    expect(result.videos).toHaveLength(2);
    expect(result.videos[0].playlistItemId).not.toBe(
      result.videos[1].playlistItemId,
    );
  });

  it('comparte una consulta entre solicitudes simultáneas', async () => {
    let resolveFetch: (value: Response) => void;
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const first = service.getVideos(playlistUrl);
    const second = service.getVideos(playlistUrl);
    resolveFetch!(response([item(0)]));
    await expect(first).resolves.toEqual(await second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('actualiza los videos después de vencer la caché', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    fetchMock.mockResolvedValueOnce(response([item(0)]));
    await service.getVideos(playlistUrl);
    clock.mockReturnValue(1000 + 5 * 60 * 1000 + 1);
    fetchMock.mockResolvedValueOnce(response([item(0), item(1)]));
    const result = await service.getVideos(playlistUrl);
    expect(result.videos).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    `https://youtube.com.ejemplo.test/playlist?list=${playlistId}`,
    `https://youtube.com@ejemplo.test/playlist?list=${playlistId}`,
    `ftp://youtube.com/playlist?list=${playlistId}`,
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
  ])('rechaza enlaces ajenos o sin playlist: %s', async (url) => {
    await expect(service.getVideos(url)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no realiza consultas sin la clave de YouTube', async () => {
    config.get.mockReturnValue(undefined);
    await expect(service.getVideos(playlistUrl)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no expone la clave en errores y permite reintentar una consulta fallida', async () => {
    fetchMock.mockRejectedValueOnce(
      new Error('Request with key=test-server-key failed'),
    );
    await expect(service.getVideos(playlistUrl)).rejects.toThrow(
      'No se pudo consultar',
    );
    fetchMock.mockResolvedValueOnce(response([item(0)]));
    await expect(service.getVideos(playlistUrl)).resolves.toMatchObject({
      videos: [expect.anything()],
    });
  });

  it('informa cuando una playlist no está disponible', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(service.getVideos(playlistUrl)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('detiene la consulta si YouTube repite una página', async () => {
    fetchMock.mockResolvedValue(response([item(0)], 'same-page'));
    await expect(service.getVideos(playlistUrl)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
