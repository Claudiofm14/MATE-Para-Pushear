import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface YoutubePlaylistVideo {
  playlistItemId: string;
  videoId: string;
  titulo: string;
  url: string;
  orden: number;
}

export interface YoutubePlaylistVideos {
  playlistId: string;
  videos: YoutubePlaylistVideo[];
}

interface PlaylistItemsResponse {
  nextPageToken?: string;
  items: Array<{
    id: string;
    snippet: {
      title: string;
      position: number;
      resourceId: { videoId?: string };
    };
    status?: { privacyStatus?: string };
  }>;
}

@Injectable()
export class YoutubePlaylistService {
  private readonly cache = new Map<
    string,
    { expiresAt: number; value: YoutubePlaylistVideos }
  >();
  private readonly pending = new Map<string, Promise<YoutubePlaylistVideos>>();

  constructor(private readonly configService: ConfigService) {}

  async getVideos(rawUrl: string): Promise<YoutubePlaylistVideos> {
    const playlistId = this.getPlaylistId(rawUrl);
    const cached = this.cache.get(playlistId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const existing = this.pending.get(playlistId);
    if (existing) return existing;

    const request = this.loadVideos(playlistId);
    this.pending.set(playlistId, request);
    try {
      const value = await request;
      // Reutilizar las consultas durante cinco minutos y limitar la memoria.
      this.cache.delete(playlistId);
      if (this.cache.size >= 100) {
        this.cache.delete(this.cache.keys().next().value);
      }
      this.cache.set(playlistId, {
        expiresAt: Date.now() + 5 * 60 * 1000,
        value,
      });
      return value;
    } finally {
      this.pending.delete(playlistId);
    }
  }

  private getPlaylistId(rawUrl: string): string {
    try {
      const value = rawUrl.trim();
      const url = new URL(
        /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`,
      );
      const playlistId = url.searchParams.get('list');
      if (
        ['http:', 'https:'].includes(url.protocol) &&
        [
          'youtube.com',
          'www.youtube.com',
          'm.youtube.com',
          'youtu.be',
        ].includes(url.hostname) &&
        playlistId &&
        /^[a-zA-Z0-9_-]+$/.test(playlistId)
      ) {
        return playlistId;
      }
    } catch {
      // Dar el mismo error para una URL mal formada o de otro sitio.
    }
    throw new BadRequestException(
      'El enlace no corresponde a una playlist de YouTube.',
    );
  }

  private async loadVideos(playlistId: string): Promise<YoutubePlaylistVideos> {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'La lista de videos de YouTube no está disponible en este momento.',
      );
    }

    const videos: YoutubePlaylistVideo[] = [];
    const pageTokens = new Set<string>();
    let pageToken = '';
    try {
      do {
        if (pageTokens.has(pageToken)) {
          throw new BadGatewayException('No se pudo completar la playlist.');
        }
        pageTokens.add(pageToken);
        const url = new URL(
          'https://www.googleapis.com/youtube/v3/playlistItems',
        );
        url.searchParams.set('part', 'snippet,status');
        url.searchParams.set('playlistId', playlistId);
        url.searchParams.set('maxResults', '50');
        url.searchParams.set('key', apiKey);
        if (pageToken) url.searchParams.set('pageToken', pageToken);

        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000),
        });
        if (response.status === 404) {
          throw new NotFoundException(
            'La playlist de YouTube no está disponible.',
          );
        }
        if (!response.ok) {
          throw new BadGatewayException(
            'No se pudo consultar la lista de videos de YouTube.',
          );
        }

        const data: PlaylistItemsResponse = await response.json();
        if (!Array.isArray(data.items)) {
          throw new BadGatewayException(
            'YouTube no devolvió una lista de videos.',
          );
        }
        for (const item of data.items) {
          const videoId = item.snippet?.resourceId?.videoId;
          const titulo = item.snippet?.title;
          if (
            !videoId ||
            !/^[a-zA-Z0-9_-]{11}$/.test(videoId) ||
            !titulo ||
            ['Private video', 'Deleted video'].includes(titulo) ||
            item.status?.privacyStatus === 'private'
          ) {
            continue;
          }
          videos.push({
            playlistItemId: item.id,
            videoId,
            titulo,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            orden: item.snippet.position + 1,
          });
        }
        pageToken = data.nextPageToken || '';
      } while (pageToken);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      // No exponer la URL de la petición: contiene la clave del servidor.
      throw new BadGatewayException(
        'No se pudo consultar la lista de videos de YouTube.',
      );
    }

    videos.sort((first, second) => first.orden - second.orden);
    return { playlistId, videos };
  }
}
