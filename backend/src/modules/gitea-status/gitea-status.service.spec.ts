import { getRepo, listRepoCommits } from '../../lib/gitea';
import { GiteaStatusService } from './gitea-status.service';

jest.mock('../../lib/gitea', () => ({
  getRepo: jest.fn(),
  listRepoCommits: jest.fn(),
}));

describe('GiteaStatusService sync', () => {
  beforeEach(() => jest.resetAllMocks());

  it('syncs all repositories with limited concurrency and keeps going after a Gitea failure', async () => {
    const records = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      giteaOwnerOrg: 'catedra',
      giteaRepoName: `repo-${index + 1}`,
      status: 'created',
    }));
    let activeRequests = 0;
    let maxActiveRequests = 0;
    const pending: Array<() => void> = [];
    const saved: any[] = [];
    const completed = new Set<number>();
    const builder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockImplementation(async () => {
        if (builder.getMany.mock.calls.length === 1) return records;
        expect(completed.size).toBe(records.length);
        return saved;
      }),
    };
    const repository = {
      createQueryBuilder: jest.fn(() => builder),
      save: jest.fn(async (record: any) => {
        saved.push(record);
        completed.add(record.id);
        return record;
      }),
    };
    (getRepo as jest.Mock).mockImplementation(
      (_owner: string, name: string) => {
        activeRequests++;
        maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
        return new Promise((resolve, reject) => {
          pending.push(() => {
            activeRequests--;
            if (name === 'repo-3') reject(new Error('Gitea unavailable'));
            else resolve({ html_url: `https://gitea.test/catedra/${name}` });
          });
        });
      },
    );
    (listRepoCommits as jest.Mock).mockResolvedValue([
      {
        sha: 'commit-sha',
        commit: {
          message: 'Trabajo entregado',
          author: { name: 'Alumno', date: '2026-10-08T19:00:00Z' },
        },
      },
    ]);

    const service = new GiteaStatusService(repository as any);
    const sync = service.syncByMateria(7);
    // Liberamos cada tanda sin usar esperas de tiempo real.
    for (
      let round = 0;
      round < 12 && completed.size < records.length;
      round++
    ) {
      await new Promise<void>((resolve) => setImmediate(resolve));
      pending.splice(0).forEach((release) => release());
    }
    const result = await sync;

    expect(maxActiveRequests).toBe(5);
    expect(getRepo).toHaveBeenCalledTimes(12);
    expect(repository.save).toHaveBeenCalledTimes(12);
    expect(
      result.filter((record) => record.syncStatus === 'synced'),
    ).toHaveLength(11);
    expect(result.find((record) => record.id === 3)).toMatchObject({
      syncStatus: 'failed',
      errorMessage: 'Gitea unavailable',
    });
    expect(result.find((record) => record.id === 1)).toMatchObject({
      lastCommitSha: 'commit-sha',
      lastCommitAuthor: 'Alumno',
      lastCommitMessage: 'Trabajo entregado',
      repoExists: true,
      status: 'created',
    });
    expect(builder.where).toHaveBeenCalledWith(
      'cursada.materiaId = :materiaId',
      { materiaId: 7 },
    );
  });
});
