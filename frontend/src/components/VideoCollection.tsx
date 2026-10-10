import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  ListVideo,
  Pencil,
  RotateCw,
  Trash2,
} from 'lucide-react';
import {
  Video,
  videoService,
  YoutubePlaylistVideos,
} from '../services/video.service';
import { getYoutubePlaylistId } from '../utils/youtube';

interface VideoCollectionProps {
  video: Video;
  onEdit?: (video: Video) => void;
  onDelete?: (video: Video) => void;
  renderVideo: (video: Video, isPlaylistItem: boolean) => React.ReactNode;
}

type PlaylistState =
  | { source: string; status: 'loading' | 'error' }
  | { source: string; status: 'ready'; data: YoutubePlaylistVideos };

const PlaylistVideos: React.FC<VideoCollectionProps> = ({
  video,
  onEdit,
  onDelete,
  renderVideo,
}) => {
  const source = `${video.id}:${video.url}`;
  const [state, setState] = useState<PlaylistState>({
    source,
    status: 'loading',
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ source, status: 'loading' });
    videoService.getPlaylistVideos(video.id, controller.signal).then(
      data => {
        if (!controller.signal.aborted) {
          setState({ source, status: 'ready', data });
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setState({ source, status: 'error' });
        }
      }
    );
    return () => controller.abort();
  }, [video.id, source, attempt]);

  const current: PlaylistState =
    state.source === source ? state : { source, status: 'loading' };

  return (
    <section
      aria-label={`Playlist ${video.titulo}`}
      className="col-span-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/50 sm:p-5"
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
            <ListVideo className="h-5 w-5 shrink-0 text-red-500" />
            <span className="break-words">{video.titulo}</span>
          </h3>
          {video.subtitulo && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {video.subtitulo}
            </p>
          )}
          {current.status === 'ready' && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {current.data.videos.length}{' '}
              {current.data.videos.length === 1 ? 'video' : 'videos'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-bold text-slate-600 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-300"
          >
            <ExternalLink className="h-4 w-4" />
            Ver playlist en YouTube
          </a>
          {onEdit && (
            <button
              type="button"
              aria-label={`Editar playlist ${video.titulo}`}
              onClick={() => onEdit(video)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-white/10"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label={`Eliminar playlist ${video.titulo}`}
              onClick={() => onDelete(video)}
              className="rounded-lg p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {current.status === 'loading' && (
        <p
          role="status"
          className="py-6 text-sm text-slate-500 dark:text-slate-400"
        >
          Cargando videos de la playlist…
        </p>
      )}
      {current.status === 'error' && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <p role="alert">
              No se pudo cargar la lista de videos. Podés reproducir la playlist
              o abrirla en YouTube.
            </p>
            <button
              type="button"
              onClick={() => setAttempt(value => value + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <RotateCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {renderVideo(video, true)}
          </div>
        </>
      )}
      {current.status === 'ready' &&
        (current.data.videos.length === 0 ? (
          <p className="py-6 text-sm text-slate-500 dark:text-slate-400">
            No hay videos públicos disponibles en esta playlist.
          </p>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {current.data.videos.map(item => (
              <React.Fragment key={item.playlistItemId}>
                {renderVideo(
                  {
                    ...video,
                    titulo: item.titulo,
                    subtitulo: undefined,
                    url: item.url,
                    orden: item.orden,
                  },
                  // Las acciones se aplican a la playlist guardada completa.
                  true
                )}
              </React.Fragment>
            ))}
          </div>
        ))}
    </section>
  );
};

export const VideoCollection: React.FC<VideoCollectionProps> = props =>
  getYoutubePlaylistId(props.video.url) ? (
    <PlaylistVideos {...props} />
  ) : (
    <>{props.renderVideo(props.video, false)}</>
  );
