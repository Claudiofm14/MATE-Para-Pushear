import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiService } from './api.service';

describe('ApiService GET coalescing', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shares one network request for identical concurrent GETs', async () => {
    let resolveRequest: (value: { data: { ok: boolean } }) => void;
    const response = new Promise<{ data: { ok: boolean } }>(resolve => {
      resolveRequest = resolve;
    });
    const get = vi
      .spyOn(apiService.getAxiosInstance(), 'get')
      .mockReturnValue(response as any);

    const first = apiService.get<{ ok: boolean }>('/dedupe-test');
    const second = apiService.get<{ ok: boolean }>('/dedupe-test');

    expect(get).toHaveBeenCalledTimes(1);
    resolveRequest!({ data: { ok: true } });
    await expect(first).resolves.toEqual({ ok: true });
    await expect(second).resolves.toEqual({ ok: true });
  });
});
