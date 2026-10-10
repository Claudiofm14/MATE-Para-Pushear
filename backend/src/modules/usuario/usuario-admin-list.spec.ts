import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GiteaApiError, listGiteaUsers } from '../../lib/gitea';
import { AdminUsuariosQueryDto } from './dto/admin-usuarios-query.dto';
import { UsuarioService } from './usuario.service';

jest.mock('../../lib/gitea', () => ({
  ...jest.requireActual('../../lib/gitea'),
  listGiteaUsers: jest.fn(),
}));

describe('Admin user directory', () => {
  const platformUsers = [
    {
      id: 1,
      email: 'ana@test.local',
      nombre: 'Ana',
      apellido: 'Alvarez',
      rol: 'alumno',
      activo: true,
      githubUser: 'ana',
    },
    {
      id: 2,
      email: 'bea@test.local',
      nombre: 'Bea',
      apellido: 'Benitez',
      rol: 'docente',
      activo: true,
      githubUser: 'bea',
    },
  ];
  const giteaUsers = [
    { id: 101, login: 'ana', email: 'ana@test.local' },
    { id: 102, login: 'cuenta-sin-vincular', email: 'otra@test.local' },
  ];
  const originalAdminEmails = process.env.AUTH_ADMIN_EMAILS;
  let repository: { find: jest.Mock };
  let service: UsuarioService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_ADMIN_EMAILS = '';
    repository = {
      find: jest.fn(async (options) =>
        platformUsers
          .filter(
            (user) =>
              !options.where.id || options.where.id.value.includes(user.id),
          )
          .filter(
            (user) => !options.where.rol || user.rol === options.where.rol,
          )
          .map((user) => ({ ...user, materiasProfesor: [] })),
      ),
    };
    service = new UsuarioService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    (listGiteaUsers as jest.Mock).mockResolvedValue(giteaUsers);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    if (originalAdminEmails === undefined) delete process.env.AUTH_ADMIN_EMAILS;
    else process.env.AUTH_ADMIN_EMAILS = originalAdminEmails;
  });

  it('shares one Gitea download between concurrent endpoints and hydrates only the requested page', async () => {
    let resolveUsers: (users: any[]) => void;
    (listGiteaUsers as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveUsers = resolve;
      }),
    );
    const query = new AdminUsuariosQueryDto();
    query.limit = 1;
    const pageRequest = service.listarUsuariosAdminPaginado(query);
    const directoryRequest = service.listarUsuariosGitea();
    resolveUsers!(giteaUsers);
    const [page, directory] = await Promise.all([
      pageRequest,
      directoryRequest,
    ]);

    expect(listGiteaUsers).toHaveBeenCalledTimes(1);
    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      platformUser: { id: 1 },
      giteaUser: { username: 'ana' },
    });
    expect(page.gitea).toEqual({
      total: 2,
      syncedAt: directory.syncedAt,
      error: null,
    });
    const relationsQuery = repository.find.mock.calls.find(
      ([options]) => options.relations,
    )?.[0];
    expect(relationsQuery.where.id.value).toEqual([1]);
  });

  it('reuses the directory across filters and pages and refreshes when explicitly requested', async () => {
    await service.listarUsuariosAdminPaginado(new AdminUsuariosQueryDto());
    const query = new AdminUsuariosQueryDto();
    query.search = 'bea';
    const filtered = await service.listarUsuariosAdminPaginado(query);
    expect(filtered.items.map((row) => row.platformUser?.id)).toEqual([2]);
    query.search = '';
    query.page = 2;
    query.limit = 1;
    await service.listarUsuariosAdminPaginado(query);
    expect(listGiteaUsers).toHaveBeenCalledTimes(1);

    (listGiteaUsers as jest.Mock).mockResolvedValue([
      { id: 103, login: 'nueva' },
    ]);
    query.refreshGitea = true;
    const refreshed = await service.listarUsuariosAdminPaginado(query);
    expect(listGiteaUsers).toHaveBeenCalledTimes(2);
    expect(refreshed.gitea.total).toBe(1);
  });

  it('expires the directory after a minute', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    await service.listarUsuariosAdminPaginado(new AdminUsuariosQueryDto());
    clock.mockReturnValue(now + 60_001);
    await service.listarUsuariosAdminPaginado(new AdminUsuariosQueryDto());
    expect(listGiteaUsers).toHaveBeenCalledTimes(2);
  });

  it('returns campus users and a sanitized warning when Gitea fails, without repeating the failed download for each filter', async () => {
    (listGiteaUsers as jest.Mock).mockRejectedValue(
      new GiteaApiError(503, 'Unavailable', 'private-upstream-detail'),
    );
    const page = await service.listarUsuariosAdminPaginado(
      new AdminUsuariosQueryDto(),
    );
    expect(page.items.map((row) => row.platformUser?.id)).toEqual([1, 2]);
    expect(page.gitea).toMatchObject({ total: 0, syncedAt: null });
    expect(page.gitea.error).toContain('temporalmente');
    expect(page.gitea.error).not.toContain('private-upstream-detail');
    await service.listarUsuariosAdminPaginado(new AdminUsuariosQueryDto());
    expect(listGiteaUsers).toHaveBeenCalledTimes(1);
  });

  it('preserves the last complete Gitea directory if refreshing fails', async () => {
    const first = await service.listarUsuariosAdminPaginado(
      new AdminUsuariosQueryDto(),
    );
    (listGiteaUsers as jest.Mock).mockRejectedValue(
      new GiteaApiError(502, 'Bad Gateway', 'failed'),
    );
    const query = new AdminUsuariosQueryDto();
    query.refreshGitea = true;
    const refreshed = await service.listarUsuariosAdminPaginado(query);
    expect(refreshed.items).toEqual(first.items);
    expect(refreshed.gitea.syncedAt).toBe(first.gitea.syncedAt);
    expect(refreshed.gitea.error).toBeTruthy();
  });

  it('aborts a slow directory download and responds with campus users within the total Gitea budget', async () => {
    jest.useFakeTimers();
    jest.spyOn(AbortSignal, 'timeout').mockImplementation((delay) => {
      const controller = new AbortController();
      setTimeout(
        () => controller.abort(new DOMException('Timed out', 'TimeoutError')),
        delay,
      );
      return controller.signal;
    });
    (listGiteaUsers as jest.Mock).mockImplementation(
      ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        }),
    );
    const pending = service.listarUsuariosAdminPaginado(
      new AdminUsuariosQueryDto(),
    );
    await jest.advanceTimersByTimeAsync(5_000);
    const page = await pending;
    expect(page.total).toBe(2);
    expect(page.gitea.error).toBe('Gitea demoro demasiado en responder');
    expect((listGiteaUsers as jest.Mock).mock.calls[0][0].signal.aborted).toBe(
      true,
    );
  });

  it('parses refreshGitea=false as false and rejects invalid values', async () => {
    const query = plainToInstance(AdminUsuariosQueryDto, {
      refreshGitea: 'false',
    });
    expect(query.refreshGitea).toBe(false);
    expect(await validate(query)).toHaveLength(0);
    const invalid = plainToInstance(AdminUsuariosQueryDto, {
      refreshGitea: 'yes',
    });
    expect(await validate(invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'refreshGitea' }),
      ]),
    );
  });
});
