import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ExternalLink,
  Pencil,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
  Video as VideoIcon,
} from 'lucide-react';
import { useAuth } from '../auth/contexts/AuthContext';
import { Button } from '../../shared/design-system/components/Button';
import { Card } from '../../shared/design-system/components/Card';
import { Badge } from '../../shared/design-system/components/Badge';
import { VideoFormModal } from '../../components/VideoFormModal';
import { VideoCollection } from '../../components/VideoCollection';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MateriaAccessGuard } from '../../components/MateriaAccessGuard';
import { usePermissions, useToast, useConfirm } from '../../hooks';
import { useMateriaConfig } from '../../hooks/useMateriaConfig';
import { useMateriaCursada } from '../../hooks/useMateriaCursada';
import { videoService, Video } from '../../services';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getYoutubePlaylistId, toEmbedUrl } from '../../utils/youtube';

// --- Componentes ---

interface VideoCardProps {
  video: Video;
  onEdit?: (video: Video) => void;
  onDelete?: (video: Video) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onEdit, onDelete }) => {
  const isPlaylist = Boolean(getYoutubePlaylistId(video.url));

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.96] shadow-xl shadow-slate-950/15 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-2xl dark:bg-slate-900/90">
      {/* Thumbnail / Preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950 transition-all duration-300">
        <iframe
          title={video.titulo}
          src={toEmbedUrl(video.url)}
          loading="lazy"
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Overlay Gradient (only visible when not playing, but iframe covers it usually. 
            If we used an image thumbnail, this would be useful. 
            For now, we keep it simple or add a border/shadow effect) */}

        {/* Actions (Edit/Delete) */}
        {(onEdit || onDelete) && (
          <div className="absolute right-2 top-2 z-20 flex translate-y-0 gap-2 opacity-100 transition-all duration-300 sm:-translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
            {onEdit && (
              <button
                onClick={() => onEdit(video)}
                className="rounded-xl border border-white/15 bg-slate-950/80 p-2 text-emerald-200 shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-emerald-300 hover:text-slate-950"
                title={isPlaylist ? 'Editar playlist' : 'Editar video'}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(video)}
                className="rounded-xl border border-white/15 bg-slate-950/80 p-2 text-red-200 shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-red-500 hover:text-white"
                title={isPlaylist ? 'Eliminar playlist' : 'Eliminar video'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-grow flex-col p-5">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-emerald-300 transition-transform duration-300 group-hover:scale-105 dark:bg-emerald-300 dark:text-slate-950">
            <PlayCircle className="h-5 w-5" />
          </div>
          <h3 className="line-clamp-2 text-lg font-black text-slate-950 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
            {video.titulo}
          </h3>
        </div>

        {video.subtitulo && (
          <p className="mb-4 line-clamp-2 flex-grow text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
            {video.subtitulo}
          </p>
        )}

        <div className="mt-auto border-t border-slate-200 pt-4 dark:border-white/10">
          <button
            onClick={() => window.open(video.url, '_blank')}
            className="group/btn flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-black text-white transition-all hover:-translate-y-0.5 hover:bg-red-600 dark:bg-white/10 dark:hover:bg-red-600"
          >
            <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
            <span>
              {isPlaylist ? 'Ver playlist en YouTube' : 'Ver en YouTube'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const VideosPage: React.FC = () => {
  const { id: materiaId } = useParams<{ id: string }>();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { config } = useMateriaConfig(materiaId ? Number(materiaId) : null);
  const { cursadaId, loadingCursada } = useMateriaCursada(
    materiaId ? Number(materiaId) : null
  );
  const toast = useToast();
  const { confirmState, confirm } = useConfirm();
  const { isInitialized, authenticated } = useAuth();

  // Estados
  const [videos, setVideos] = useState<Video[]>([]);
  const playlistCount = videos.filter(video =>
    getYoutubePlaylistId(video.url)
  ).length;
  const videoCount = videos.length - playlistCount;
  const contentSummary = [
    videoCount > 0
      ? `${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`
      : null,
    playlistCount > 0
      ? `${playlistCount} ${playlistCount === 1 ? 'playlist' : 'playlists'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Cargar videos
  const loadVideos = React.useCallback(async () => {
    try {
      setLoading(true);
      // Filtrar por materia si existe el ID
      let allVideos: Video[] = [];
      if (materiaId) {
        allVideos = await videoService.getByMateria(parseInt(materiaId));
      } else {
        allVideos = await videoService.getAll();
      }
      setVideos(allVideos);
    } catch (error: any) {
      console.error('Error al cargar videos:', error);
      toast.error('Error al cargar los videos');
    } finally {
      setLoading(false);
    }
  }, [materiaId, toast]);

  useEffect(() => {
    // Solo cargar si Auth.js está inicializado para evitar peticiones sin token
    if (isInitialized && authenticated) {
      loadVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId, isInitialized, authenticated]);

  // Manejar creación
  const handleCreate = () => {
    setSelectedVideo(null);
    setIsFormOpen(true);
  };

  // Manejar edición
  const handleEdit = (video: Video) => {
    setSelectedVideo(video);
    setIsFormOpen(true);
  };

  // Manejar eliminacion
  const handleDelete = async (video: Video) => {
    const confirmed = await confirm({
      title: 'Eliminar video',
      message: `¿Estás seguro de que deseas eliminar el video "${video.titulo}"? Esta acción se puede revertir.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await videoService.delete(video.id);
      toast.success('Video eliminado exitosamente');
      loadVideos();
    } catch (error: any) {
      console.error('Error al eliminar video:', error);
      toast.error('Error al eliminar el video');
    }
  };

  // Manejar éxito del formulario
  const handleFormSuccess = () => {
    loadVideos();
  };

  if (loadingCursada) {
    return <LoadingSpinner fullScreen size="lg" label="Cargando videos..." />;
  }

  return (
    <MateriaAccessGuard
      materiaId={parseInt(materiaId || '0')}
      materiaNombre="Materia"
      cursadaId={cursadaId}
    >
      <div className="materia-page-shell">
        <div className="materia-page-gradient" />
        <div className="materia-page-grid" />
        {/* HERO SECTION */}
        <section className="materia-hero">
          <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="max-w-4xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="materia-chip-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                  <Sparkles className="h-3.5 w-3.5" />
                  Aula digital ITI
                </span>
                <span className="materia-chip-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold">
                  <VideoIcon className="h-3.5 w-3.5" />
                  Biblioteca audiovisual
                </span>
              </div>
              <h1 className="materia-hero-title max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
                {config.pages.videos?.titulo || 'Videos'}
              </h1>{' '}
              <p className="materia-hero-description mt-4 max-w-3xl text-lg font-medium leading-8">
                {config.pages.videos?.descripcion ||
                  'Videotutoriales y guías paso a paso para complementar tu aprendizaje.'}
              </p>
            </div>
          </div>
        </section>

        <div className="container relative z-10 mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Acciones */}
          <div className="mb-8 flex justify-end">
            {canCreate && (
              <Button
                variant="primary"
                onClick={handleCreate}
                className="w-full rounded-2xl border-none bg-emerald-400 px-5 py-3 font-black text-slate-950 dark:text-white shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-300 sm:w-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar video o playlist
              </Button>
            )}
          </div>

          {/* Contenido */}
          {loading ? (
            <LoadingSpinner size="lg" label="Cargando videos..." />
          ) : videos.length > 0 ? (
            <div className="space-y-12">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                    Videos de la materia
                  </h2>
                  <Badge variant="info" size="sm">
                    {contentSummary}
                  </Badge>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map(video => (
                    <VideoCollection
                      key={video.id}
                      video={video}
                      onEdit={canEdit ? handleEdit : undefined}
                      onDelete={canDelete ? handleDelete : undefined}
                      renderVideo={(item, isPlaylistItem) => (
                        <VideoCard
                          video={item}
                          onEdit={
                            canEdit && !isPlaylistItem ? handleEdit : undefined
                          }
                          onDelete={
                            canDelete && !isPlaylistItem
                              ? handleDelete
                              : undefined
                          }
                        />
                      )}
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <Card className="border-white/10 bg-white/[0.96] py-12 text-center shadow-2xl shadow-slate-950/15 dark:bg-slate-900/90">
              <div className="mb-2 text-slate-500 dark:text-slate-400">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                  <VideoIcon className="h-8 w-8" />
                </div>
                <p className="mb-4 text-lg font-bold">
                  No hay videos disponibles.
                </p>
                {canCreate && (
                  <Button
                    variant="primary"
                    onClick={handleCreate}
                    className="rounded-2xl border-none bg-emerald-400 font-black text-slate-950 dark:text-white hover:bg-emerald-300"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Agregar video o playlist
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Modal de formulario */}
        <VideoFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          video={selectedVideo}
          materiaId={materiaId ? parseInt(materiaId) : undefined}
          cursadaId={
            selectedVideo?.semanaId || selectedVideo?.semana?.id
              ? undefined
              : cursadaId || undefined
          }
        />

        {/* Diálogo de confirmación */}
        <ConfirmDialog {...confirmState} />
      </div>
    </MateriaAccessGuard>
  );
};

export default VideosPage;
