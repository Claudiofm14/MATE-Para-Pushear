import { describe, expect, it } from 'vitest';
import {
  getYoutubePlaylistId,
  getYoutubeVideoId,
  parseYoutubeUrl,
  toEmbedUrl,
} from './youtube';

const videoId = 'dQw4w9WgXcQ';
const playlistId = 'PLBC5Xu0KKOJM-OKZD7d8SiYMo3L0PEGwR';

describe('YouTube URLs', () => {
  it.each([
    `https://youtu.be/${videoId}`,
    `https://www.youtube.com/watch?v=${videoId}`,
    `https://www.youtube.com/embed/${videoId}`,
    `https://www.youtube.com/shorts/${videoId}`,
    `https://www.youtube.com/live/${videoId}`,
  ])('mantiene el soporte de videos individuales: %s', url => {
    expect(getYoutubeVideoId(url)).toBe(videoId);
    expect(toEmbedUrl(url)).toBe(
      `https://www.youtube.com/embed/${videoId}?rel=0`
    );
  });

  it.each([
    `https://youtube.com/playlist?list=${playlistId}&si=fiAElvzp2BTXCzmD`,
    `https://www.youtube.com/embed/videoseries?list=${playlistId}`,
    `https://www.youtube.com/embed?listType=playlist&list=${playlistId}`,
  ])('carga la playlist completa sin tratarla como un video: %s', url => {
    expect(getYoutubeVideoId(url)).toBeNull();
    expect(getYoutubePlaylistId(url)).toBe(playlistId);

    const embed = new URL(toEmbedUrl(url));
    expect(embed.pathname).toBe('/embed');
    expect(embed.searchParams.get('listType')).toBe('playlist');
    expect(embed.searchParams.get('list')).toBe(playlistId);
    expect(embed.searchParams.has('si')).toBe(false);
  });

  it('conserva el video inicial cuando el enlace también contiene una playlist', () => {
    const embed = new URL(
      toEmbedUrl(
        `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}`,
        true
      )
    );

    expect(embed.pathname).toBe(`/embed/${videoId}`);
    expect(embed.searchParams.get('list')).toBe(playlistId);
    expect(embed.searchParams.get('autoplay')).toBe('1');
  });

  it('normaliza los enlaces pegados sin protocolo y con espacios exteriores', () => {
    expect(
      parseYoutubeUrl(`  youtube.com/playlist?list=${playlistId}  `)?.href
    ).toBe(`https://youtube.com/playlist?list=${playlistId}`);
  });

  it.each([
    undefined,
    '',
    'no es una URL',
    `https://youtube.com.ejemplo.test/playlist?list=${playlistId}`,
    `https://youtube.com@ejemplo.test/playlist?list=${playlistId}`,
    `ftp://youtube.com/playlist?list=${playlistId}`,
    'https://www.youtube.com/playlist?list=',
    'https://www.youtube.com/playlist?list=lista%20inv%C3%A1lida',
    'https://www.youtube.com/embed/videoseries',
  ])('rechaza enlaces sin un video o playlist válido: %s', url => {
    expect(toEmbedUrl(url)).toBe('');
  });
});
