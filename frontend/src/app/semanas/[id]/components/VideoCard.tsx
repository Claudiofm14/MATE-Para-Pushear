import React from 'react';
import { ExternalLink, Play, Video as VideoIcon } from 'lucide-react';
import { Video as VideoType } from '../../../../services';
import { CARD_SURFACE, CardRail, FOCUS_RING, TeacherActions } from './cardKit';
import {
  getYoutubeVideoId as getYoutubeId,
  getYoutubePlaylistId,
  toEmbedUrl,
} from '../../../../utils/youtube';

export {
  getYoutubeVideoId as getYoutubeId,
  toEmbedUrl,
} from '../../../../utils/youtube';

/**
 * Portada del reproductor.
 *
 * Antes cada tarjeta montaba un iframe de YouTube al abrir la semana: una
 * semana con seis videos cargaba seis reproductores completos (y su
 * javascript de terceros) aunque nadie los mirara. Ahora se muestra la
 * miniatura y el iframe recien se monta al pulsar play.
 */
const VideoPoster: React.FC<{
  videoId: string | null;
  titulo: string;
  onPlay: () => void;
}> = ({ videoId, titulo, onPlay }) => {
  const [thumbnail, setThumbnail] = React.useState(
    videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : null
  );

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Reproducir ${titulo}`}
      className={`group/poster relative block aspect-video w-full overflow-hidden bg-slate-950 ${FOCUS_RING} focus-visible:ring-red-500/70`}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() =>
            // maxresdefault no existe para todos los videos; hqdefault siempre si.
            setThumbnail(
              videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null
            )
          }
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover/poster:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
          <VideoIcon className="h-10 w-10 text-white/25" />
        </div>
      )}

      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent opacity-80 transition-opacity duration-300 group-hover/poster:opacity-95"
      />

      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 shadow-2xl shadow-red-950/50 transition-all duration-300 ease-out group-hover/poster:scale-110 group-hover/poster:bg-red-500"
      >
        <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
      </span>
    </button>
  );
};

export const VideoCard: React.FC<{
  video: VideoType;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (video: VideoType) => void;
  onDelete: (video: VideoType) => void;
}> = ({ video, canEdit, canDelete, onEdit, onDelete }) => {
  const [playing, setPlaying] = React.useState(false);
  const videoId = getYoutubeId(video.url);
  const playlistId = getYoutubePlaylistId(video.url);

  return (
    <article
      className={`${CARD_SURFACE} hover:border-red-400/50 dark:hover:border-red-400/30`}
    >
      <CardRail accent="slate" />

      <div className="relative w-full">
        {playing ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              title={video.titulo}
              src={toEmbedUrl(video.url, true)}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <VideoPoster
            videoId={videoId}
            titulo={video.titulo}
            onPlay={() => setPlaying(true)}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <header className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-[15px] font-black leading-snug text-slate-950 dark:text-white">
            {video.titulo}
          </h3>
          <TeacherActions
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => onEdit(video)}
            onDelete={() => onDelete(video)}
            editLabel={`Editar ${playlistId ? 'playlist' : 'video'} ${video.titulo}`}
            deleteLabel={`Eliminar ${playlistId ? 'playlist' : 'video'} ${video.titulo}`}
          />
        </header>

        {video.subtitulo && (
          <p className="line-clamp-2 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
            {video.subtitulo}
          </p>
        )}

        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg pt-1 text-[13px] font-bold text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 ${FOCUS_RING} focus-visible:ring-red-500/60`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {playlistId
            ? 'Ver playlist en YouTube'
            : videoId
              ? 'Ver en YouTube'
              : 'Abrir enlace original'}
        </a>
      </div>
    </article>
  );
};

export default VideoCard;
