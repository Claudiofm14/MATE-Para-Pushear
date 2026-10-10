import { SemanaPreviewController } from './semana-preview.controller';
import { SemanaService } from './semana.service';

describe('SemanaPreviewController', () => {
  const originalPublicFrontendUrl = process.env.PUBLIC_FRONTEND_URL;

  afterEach(() => {
    if (originalPublicFrontendUrl === undefined) {
      delete process.env.PUBLIC_FRONTEND_URL;
    } else {
      process.env.PUBLIC_FRONTEND_URL = originalPublicFrontendUrl;
    }
  });

  it('renders dynamic Open Graph metadata and escapes stored content', async () => {
    process.env.PUBLIC_FRONTEND_URL = 'https://mate.unahur.edu.ar/materias';
    const semanaService = {
      findPublicPreview: jest.fn().mockResolvedValue({
        semanaId: 24,
        semanaTitulo: 'Colecciones & mapas',
        semanaDescripcion:
          '<p>Listas, conjuntos y <strong>mapas</strong>.</p><script>alert(1)</script>',
        numeroSemana: 4,
        materiaId: 2,
        materiaNombre: 'Programación <Objetos>',
      }),
    } as unknown as SemanaService;
    const controller = new SemanaPreviewController(semanaService);

    const html = await controller.renderPreview(2, 24);

    expect(semanaService.findPublicPreview).toHaveBeenCalledWith(2, 24);
    expect(html).toContain(
      'content="Programación &lt;Objetos&gt; · Semana 4: Colecciones &amp; mapas"',
    );
    expect(html).toContain(
      'content="https://mate.unahur.edu.ar/materia/2/semanas/24"',
    );
    expect(html).toContain(
      'content="https://mate.unahur.edu.ar/images/social-preview.png"',
    );
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
