import React, { useEffect, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { AdjuntoSoporte, soporteService } from '../../services/soporte.service';

interface AdjuntoImagenProps {
  adjunto: AdjuntoSoporte;
}

/**
 * Las capturas viven en la base y se sirven detras de la sesion, asi que se
 * descargan por XHR y se muestran como object URL en lugar de apuntar el
 * <img src> directamente al endpoint.
 */
export const AdjuntoImagen: React.FC<AdjuntoImagenProps> = ({ adjunto }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelado = false;

    soporteService
      .descargarAdjunto(adjunto.url)
      .then(blob => {
        if (cancelado) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelado) setError(true);
      });

    return () => {
      cancelado = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [adjunto.url]);

  if (error) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        <ImageOff className="h-4 w-4" />
        No se pudo cargar la imagen
      </div>
    );
  }

  if (!url) {
    return (
      <div className="mt-2 flex h-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 block overflow-hidden rounded-xl border border-slate-200 transition hover:opacity-90 dark:border-white/10"
      title={`${adjunto.nombre} — abrir en tamaño completo`}
    >
      <img
        src={url}
        alt={adjunto.nombre}
        className="max-h-56 w-full object-contain"
      />
    </a>
  );
};
