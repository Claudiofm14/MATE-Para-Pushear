import { Controller, Get, Header, Param, ParseIntPipe } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { SemanaService } from './semana.service';

const DEFAULT_SITE_ORIGIN = 'https://mate.unahur.edu.ar';
const DEFAULT_DESCRIPTION =
  'Contenidos, actividades y recursos de la semana de cursada.';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function plainText(value?: string | null): string {
  if (!value) return '';

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function getSiteOrigin(): string {
  const configuredUrl =
    process.env.PUBLIC_FRONTEND_URL ||
    process.env.FRONTEND_ORIGIN ||
    DEFAULT_SITE_ORIGIN;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

@Controller()
export class SemanaPreviewController {
  constructor(private readonly semanaService: SemanaService) {}

  @Public()
  @Get('materia/:materiaId/semanas/:semanaId')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  async renderPreview(
    @Param('materiaId', ParseIntPipe) materiaId: number,
    @Param('semanaId', ParseIntPipe) semanaId: number,
  ): Promise<string> {
    const preview = await this.semanaService.findPublicPreview(
      materiaId,
      semanaId,
    );
    const siteOrigin = getSiteOrigin();
    const url = `${siteOrigin}/materia/${materiaId}/semanas/${semanaId}`;
    const imageUrl = `${siteOrigin}/images/social-preview.png`;
    const weekLabel = `Semana ${preview.numeroSemana}`;
    const title = truncate(
      `${preview.materiaNombre} · ${weekLabel}: ${preview.semanaTitulo}`,
      100,
    );
    const description = truncate(
      plainText(preview.semanaDescripcion) || DEFAULT_DESCRIPTION,
      200,
    );

    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeUrl = escapeHtml(url);
    const safeImageUrl = escapeHtml(imageUrl);

    return `<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <link rel="canonical" href="${safeUrl}">
  <meta property="og:site_name" content="Materiales Tecnológicos · UNAHUR">
  <meta property="og:locale" content="es_AR">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:secure_url" content="${safeImageUrl}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Materiales Tecnológicos · UNAHUR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImageUrl}">
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
    <p><a href="${safeUrl}">Abrir semana</a></p>
  </main>
</body>
</html>`;
  }
}
