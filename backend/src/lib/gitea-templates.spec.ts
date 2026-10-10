import { listOrgTemplateRepos } from './gitea';

/**
 * El listado de plantillas se consulta cada vez que un docente abre el modal
 * de ejercicio. Estos tests fijan que no vuelva a pedir el detalle de cada
 * repositorio de la organizacion: los repos de los alumnos viven ahi y una
 * cursada con 60 inscriptos hacia 60+ llamadas a Gitea por apertura.
 */
describe('listOrgTemplateRepos', () => {
  const originalFetch = global.fetch;
  const originalToken = process.env.GITEA_ADMIN_TOKEN;
  const originalBaseUrl = process.env.GITEA_BASE_URL;
  let requestedPaths: string[];

  const mockGitea = (routes: Record<string, unknown>) => {
    global.fetch = jest.fn(async (url: any) => {
      const path = String(url).replace('https://gitea.test', '');
      requestedPaths.push(path);
      const body = routes[path.split('?')[0]] ?? [];
      return {
        ok: true,
        status: 200,
        json: async () => body,
        text: async () => JSON.stringify(body),
      } as any;
    }) as any;
  };

  beforeEach(() => {
    requestedPaths = [];
    process.env.GITEA_BASE_URL = 'https://gitea.test';
    process.env.GITEA_ADMIN_TOKEN = 'token-de-prueba';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GITEA_ADMIN_TOKEN = originalToken;
    process.env.GITEA_BASE_URL = originalBaseUrl;
  });

  it('usa el flag del listado sin pedir el detalle de cada repositorio', async () => {
    const repos = [
      { name: 'tp1-plantilla-base', template: true },
      { name: 'tp1-perez', template: false },
      { name: 'tp1-gomez', template: false },
      { name: 'tp1-lopez', template: false },
    ];
    mockGitea({ '/api/v1/orgs/catedra/repos': repos });

    const templates = await listOrgTemplateRepos('catedra', repos);

    expect(templates.map((repo: any) => repo.name)).toEqual([
      'tp1-plantilla-base',
    ]);
    expect(requestedPaths).toHaveLength(0);
  });

  it('reconoce plantillas por sufijo sin consultar el detalle', async () => {
    const repos = [
      { name: 'ejercicio-template' },
      { name: 'ejercicio-plantilla' },
    ];
    mockGitea({});

    const templates = await listOrgTemplateRepos('catedra', repos);

    expect(templates).toHaveLength(2);
    expect(requestedPaths).toHaveLength(0);
  });

  it('consulta el detalle solo cuando el listado no trae el flag', async () => {
    const repos = [{ name: 'sin-flag-ni-sufijo' }];
    mockGitea({
      '/api/v1/repos/catedra/sin-flag-ni-sufijo': {
        name: 'sin-flag-ni-sufijo',
        template: true,
      },
    });

    const templates = await listOrgTemplateRepos('catedra', repos);

    expect(templates).toHaveLength(1);
    expect(requestedPaths).toEqual([
      '/api/v1/repos/catedra/sin-flag-ni-sufijo',
    ]);
  });

  it('lista la organizacion una sola vez cuando no recibe los repos', async () => {
    mockGitea({
      '/api/v1/orgs/catedra/repos': [{ name: 'base-template', template: true }],
    });

    await listOrgTemplateRepos('catedra');

    expect(
      requestedPaths.filter((path) => path.includes('/orgs/catedra/repos')),
    ).toHaveLength(1);
  });
});
