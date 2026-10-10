import React, { useEffect, useRef } from 'react';
import { MensajeSoporte } from '../../services/soporte.service';
import { AdjuntoImagen } from './AdjuntoImagen';

const formatoHora = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

interface ConversacionSoporteProps {
  mensajes: MensajeSoporte[];
  /** Los mensajes de este lado se alinean a la derecha. */
  ladoAdmin: boolean;
  className?: string;
}

export const ConversacionSoporte: React.FC<ConversacionSoporteProps> = ({
  mensajes,
  ladoAdmin,
  className = '',
}) => {
  const finRef = useRef<HTMLDivElement | null>(null);
  const ultimoId = mensajes[mensajes.length - 1]?.id;

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [ultimoId]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {mensajes.map(mensaje => {
        const propio = mensaje.esAdmin === ladoAdmin;

        return (
          <div
            key={mensaje.id}
            className={`flex ${propio ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[85%]">
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  propio
                    ? 'bg-cyan-500 text-white dark:bg-cyan-400 dark:text-slate-950'
                    : 'border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100'
                }`}
              >
                {mensaje.cuerpo && (
                  <p className="overflow-wrap-anywhere whitespace-pre-wrap leading-relaxed">
                    {mensaje.cuerpo}
                  </p>
                )}
                {mensaje.adjuntos.map(adjunto => (
                  <AdjuntoImagen key={adjunto.id} adjunto={adjunto} />
                ))}
              </div>
              <p
                className={`mt-1 text-[0.68rem] font-semibold text-slate-400 dark:text-slate-500 ${
                  propio ? 'text-right' : 'text-left'
                }`}
              >
                {mensaje.esAdmin ? 'Equipo' : mensaje.autorNombre} ·{' '}
                {formatoHora.format(new Date(mensaje.createdAt))}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={finRef} />
    </div>
  );
};
