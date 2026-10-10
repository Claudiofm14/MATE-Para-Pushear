import { listGiteaUsers } from '../../lib/gitea';
import { GiteaUserSyncService } from './gitea-user-sync.service';

jest.mock('../../lib/gitea', () => ({
  listGiteaUsers: jest.fn(),
}));

describe('GiteaUserSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consulta usuarios existentes en bloque y persiste solo los cambios', async () => {
    const existing = {
      id: 10,
      email: 'existente@unahur.edu.ar',
      authProviderId: null,
      githubUser: null,
      nombre: 'Alumno',
      apellido: 'Existente',
      rol: 'alumno',
    };
    const execute = jest.fn().mockResolvedValue({ identifiers: [{ id: 11 }] });
    const queryBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute,
    };
    const repository = {
      find: jest
        .fn()
        .mockResolvedValueOnce([existing])
        .mockResolvedValueOnce([]),
      create: jest.fn((value) => ({ ...value })),
      createQueryBuilder: jest.fn(() => queryBuilder),
      save: jest.fn().mockResolvedValue(undefined),
    };
    (listGiteaUsers as jest.Mock).mockResolvedValue([
      {
        id: 101,
        email: 'existente@unahur.edu.ar',
        login: 'existente',
        full_name: 'Existente, Alumno',
      },
      {
        id: 102,
        email: 'nuevo@unahur.edu.ar',
        login: 'nuevo',
        full_name: 'Nuevo Alumno',
      },
      {
        id: 1,
        email: 'admin@unahur.edu.ar',
        login: 'admin',
        is_admin: true,
      },
    ]);

    const service = new GiteaUserSyncService(repository as any);
    const result = await service.syncUsers();

    expect(repository.find).toHaveBeenCalledTimes(2);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 10, authProviderId: '101' })],
      { chunk: 500, reload: false },
    );
    expect(result).toMatchObject({
      total: 3,
      valid: 2,
      created: 1,
      updated: 1,
      unchanged: 0,
    });
  });

  it('comparte una sincronizacion si ya hay otra en curso', async () => {
    let resolveUsers: (users: any[]) => void;
    (listGiteaUsers as jest.Mock).mockReturnValue(
      new Promise<any[]>((resolve) => {
        resolveUsers = resolve;
      }),
    );
    const repository = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((value) => ({ ...value })),
    };
    const service = new GiteaUserSyncService(repository as any);

    const first = service.syncUsers();
    const second = service.syncUsers();
    resolveUsers!([]);

    await expect(first).resolves.toMatchObject({ total: 0, valid: 0 });
    await expect(second).resolves.toMatchObject({ total: 0, valid: 0 });
    expect(listGiteaUsers).toHaveBeenCalledTimes(1);
  });

  it.each(['email', 'providerId'])(
    'actualiza un username renombrado identificado por %s sin cambiar los datos locales',
    async (matchBy) => {
      const existing = {
        id: 10,
        email: 'alumno@unahur.edu.ar',
        authProviderId: '101',
        githubUser: 'ernestofabrizio2006',
        nombre: 'Ernesto',
        apellido: 'Calzon Fabrizio',
        rol: 'alumno',
      };
      const repository = {
        find: jest
          .fn()
          .mockResolvedValueOnce(matchBy === 'email' ? [existing] : [])
          .mockResolvedValueOnce(matchBy === 'providerId' ? [existing] : []),
        save: jest.fn().mockResolvedValue(undefined),
      };
      (listGiteaUsers as jest.Mock).mockResolvedValue([
        {
          id: 101,
          email: matchBy === 'email' ? existing.email : 'nuevo@unahur.edu.ar',
          login: 'ernestoffabrizio',
          full_name: 'Otro nombre',
        },
      ]);

      const service = new GiteaUserSyncService(repository as any);
      const result = await service.syncUsers();

      expect(repository.save).toHaveBeenCalledWith(
        [{ ...existing, githubUser: 'ernestoffabrizio' }],
        { chunk: 500, reload: false },
      );
      expect(existing).toMatchObject({
        email: 'alumno@unahur.edu.ar',
        authProviderId: '101',
        nombre: 'Ernesto',
        apellido: 'Calzon Fabrizio',
        rol: 'alumno',
      });
      expect(result).toMatchObject({ created: 0, updated: 1, unchanged: 0 });

      repository.find.mockResolvedValue([existing]);
      repository.save.mockClear();
      await expect(service.syncUsers()).resolves.toMatchObject({
        updated: 0,
        unchanged: 1,
      });
      expect(repository.save).not.toHaveBeenCalled();
    },
  );

  it('omite el trabajo si otra replica posee el lock distribuido', async () => {
    const runner = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([{ acquired: false }]),
      release: jest.fn().mockResolvedValue(undefined),
      isReleased: false,
    };
    const dataSource = {
      isInitialized: true,
      createQueryRunner: jest.fn(() => runner),
    };
    const service = new GiteaUserSyncService({} as any, dataSource as any);

    await expect(service.syncUsers()).resolves.toMatchObject({
      skipped: true,
      created: 0,
      updated: 0,
    });
    expect(listGiteaUsers).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalledTimes(1);
  });
});
