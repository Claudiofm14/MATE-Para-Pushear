import { UserAwareThrottlerGuard } from './user-aware-throttler.guard';

describe('UserAwareThrottlerGuard', () => {
  const guard = Object.create(
    UserAwareThrottlerGuard.prototype,
  ) as UserAwareThrottlerGuard;

  it('separa el limite de usuarios autenticados que comparten IP', async () => {
    const first = await (guard as any).getTracker({
      ip: '10.0.0.1',
      user: { localUsuario: { id: 10 } },
    });
    const second = await (guard as any).getTracker({
      ip: '10.0.0.1',
      user: { localUsuario: { id: 11 } },
    });

    expect(first).toBe('user:10');
    expect(second).toBe('user:11');
  });

  it('mantiene limite por IP para rutas publicas', async () => {
    await expect(
      (guard as any).getTracker({ ip: '203.0.113.5' }),
    ).resolves.toBe('ip:203.0.113.5');
  });
});
