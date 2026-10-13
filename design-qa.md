# Revisión visual — Avance de Cursada

Fecha: 13 de octubre de 2026. Referencia: video proporcionado por el usuario, «WhatsApp Video 2026-10-12 at 18.38.09.mp4».

## Evidencia y normalización

- Fuente visual: `docs/avance/referencia.png`, extraída del segundo 7 del video. Se quitó el marco de Chrome/Gemini; la región de la aplicación mide 1794 × 886 píxeles.
- Implementación: `docs/avance/escritorio.png`, captura real del navegador integrado con viewport CSS 1794 × 886 y densidad 1. La captura completa mide 1784 × 1146; el navegador excluye los 10 píxeles de su scrollbar vertical.
- Comparación completa: `docs/avance/comparacion.png`, ambas vistas en el mismo archivo. Se recortó la implementación a los primeros 886 píxeles y se agregó únicamente la franja de scrollbar ausente, sin escalar la interfaz.
- Estado compartido: modo oscuro, zoom 75%, dos de seis actividades entregadas, segunda semana pendiente y siguientes pasos bloqueados.
- Comparaciones de detalle: `comparacion-encabezado.png`, `comparacion-mapa.png` y `comparacion-modal.png`, dentro de `docs/avance`. El mapa usa el segundo 16 del video para mostrar ambas ramas completas. El modal usa el segundo 22 y el mismo trabajo entregado. El modal implementado incluye acceso a la semana y explicación del registro personal; su mayor altura es intencional.
- Responsive: `docs/avance/movil.png`, viewport CSS 393 × 852, captura completa 383 × 1365. También se inspeccionaron 1024 × 900 en modo claro y 1280 × 900 con menú desplegable. El viewport temporal se restauró al terminar.

## Hallazgos finales

No quedan hallazgos P0, P1 o P2 abiertos.

- **Tipografía:** Inter y fallbacks existentes del proyecto; jerarquía, pesos, tamaño del título, descripciones y tarjetas comparados con la referencia. Las fechas compactas evitan ruido en los nodos. Los títulos extensos se limitan en la tarjeta y se muestran completos en el modal.
- **Espaciado:** encabezado de 1356 × 222 píxeles y panel de mapa con tarjetas de 256 × 160 antes del zoom. Se compararon márgenes, radios, separación de columnas y ramificaciones. El espacio vertical de los nodos difiere ligeramente de la referencia, sin afectar lectura o interacción; queda como ajuste P3 opcional.
- **Colores:** fondo azul oscuro, tarjetas azul profundo, estados y conexiones en verde/cian. El modo claro adapta superficies y contraste. Los pasos bloqueados conservan más legibilidad que en la referencia.
- **Imágenes e iconos:** se reutiliza el logo real del proyecto y sus iconos Lucide. La referencia no requiere fotografías ni ilustraciones nuevas. Las conexiones SVG representan relaciones reales entre actividades y no sustituyen recursos de imagen.
- **Contenido:** mismos títulos del recorrido, progreso, estados y detalles. El encabezado y pie del proyecto, la leyenda, el texto «Tu recorrido» del inicio y la aclaración de avance personal son adaptaciones deliberadas para integrar la función con MATE.

## Interacciones y accesibilidad

Se probó el recorrido completo 33% → 50% → 67% → 100%, su persistencia tras recargar y el reinicio a 0%. El parcial permaneció bloqueado hasta completar ambas ramas. Se verificaron zoom, desplazamiento horizontal, modal de actividades, recurso externo visible, confirmación/cancelación de reinicio, Escape y restauración de foco. Los modales nativos aíslan el foco del resto de la pantalla. Los controles tienen nombres accesibles y el progreso usa un elemento semántico.

Después de completar las respuestas de los datos de prueba, la captura final no produjo nuevos errores ni advertencias de consola. Los fallos de guardado, los estados vacíos y el reintento sin bucles se comprobaron en las pruebas de frontend.

## Historial de correcciones

1. **P2 — Ancho y proporciones de escritorio.** La primera versión usaba un encabezado de 1472 × 234 y una fila adicional para una única cursada. Se limitó el contenedor a 1420, se ajustó el padding y se mostró el selector sólo cuando tiene utilidad. Evidencia posterior: `escritorio.png` y `comparacion-encabezado.png`.
2. **P2 — Desbordamiento global en móvil.** El tamaño intrínseco del mapa ampliaba la página a 1388 píxeles con viewport de 393. Se aplicaron columnas `minmax(0, 1fr)` y mínimos de ancho en el panel y su área de scroll. La página quedó en 383 píxeles útiles y el scroll de 1344 píxeles quedó dentro del mapa. Evidencia posterior: `movil.png`; modal móvil y anchos revisados en el navegador.
3. **P2 — Superposición de navegación en notebook.** El acceso adicional hacía competir la navegación con el logo y el perfil a 1280 píxeles. Se usa el menú desplegable debajo de 1700, manteniendo todos los accesos disponibles. Se abrió el menú y se verificó el enlace Avance; en 1794 vuelve la navegación completa, como muestra `escritorio.png`.

## Resultado

Builds de frontend/backend y controles de formato correctos. Pruebas: 87 de frontend y 146 de backend, incluidas pruebas HTTP con PostgreSQL real. Migración nueva verificada en ambos sentidos sobre una base temporal.

final result: passed
