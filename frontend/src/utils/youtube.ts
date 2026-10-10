export const parseYoutubeUrl = (rawUrl?: string): URL | null => {
  const value = rawUrl?.trim();
  if (!value) return null;

  try {
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
    );

    const allowedHosts = [
      'www.youtube.com',
      'youtube.com',
      'youtu.be',
      'm.youtube.com',
    ];

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !allowedHosts.includes(url.hostname)
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
};

export const getYoutubeVideoId = (rawUrl?: string): string | null => {
  const url = parseYoutubeUrl(rawUrl);
  if (!url) return null;

  const id = url.hostname.endsWith('youtu.be')
    ? url.pathname.split('/')[1]
    : url.pathname === '/watch'
      ? url.searchParams.get('v')
      : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1];

  return id && id !== 'videoseries' && /^[a-zA-Z0-9_-]{11}$/.test(id)
    ? id
    : null;
};

export const getYoutubePlaylistId = (rawUrl?: string): string | null => {
  const id = parseYoutubeUrl(rawUrl)?.searchParams.get('list');
  return id && /^[a-zA-Z0-9_-]+$/.test(id) ? id : null;
};

export const toEmbedUrl = (rawUrl?: string, autoplay = false): string => {
  const videoId = getYoutubeVideoId(rawUrl);
  const playlistId = getYoutubePlaylistId(rawUrl);

  if (!videoId && !playlistId) return '';

  const embed = new URL(
    videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : 'https://www.youtube.com/embed'
  );

  if (playlistId) {
    embed.searchParams.set('listType', 'playlist');
    embed.searchParams.set('list', playlistId);
  }

  embed.searchParams.set('rel', '0');

  if (autoplay) {
    embed.searchParams.set('autoplay', '1');
  }

  return embed.href;
};
