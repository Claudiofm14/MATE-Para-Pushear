import { EventEmitter } from 'node:events';
import { PerformanceMiddleware } from '../middleware/performance.middleware';

describe('PerformanceMiddleware', () => {
  const originalThreshold = process.env.SLOW_REQUEST_THRESHOLD_MS;

  afterEach(() => {
    if (originalThreshold === undefined) {
      delete process.env.SLOW_REQUEST_THRESHOLD_MS;
    } else {
      process.env.SLOW_REQUEST_THRESHOLD_MS = originalThreshold;
    }
    jest.restoreAllMocks();
  });

  it('adds trace headers without exposing request data in normal responses', () => {
    process.env.SLOW_REQUEST_THRESHOLD_MS = '10000';
    const middleware = new PerformanceMiddleware();
    const response = new EventEmitter() as EventEmitter & {
      statusCode: number;
      setHeader: jest.Mock;
    };
    response.statusCode = 200;
    response.setHeader = jest.fn();
    const next = jest.fn();

    middleware.use(
      {
        method: 'GET',
        baseUrl: '/api',
        route: { path: '/materia/:id/semanas' },
        correlationId: 'correlation-1',
      } as any,
      response as any,
      next,
    );

    expect(response.setHeader).toHaveBeenCalledWith(
      'X-App-Instance',
      expect.any(String),
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-App-Version',
      expect.any(String),
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('logs only the route template for slow responses', () => {
    process.env.SLOW_REQUEST_THRESHOLD_MS = '1';
    const middleware = new PerformanceMiddleware();
    const response = new EventEmitter() as EventEmitter & {
      statusCode: number;
      setHeader: jest.Mock;
    };
    response.statusCode = 200;
    response.setHeader = jest.fn();
    const warn = jest
      .spyOn((middleware as any).logger, 'warn')
      .mockImplementation();
    jest
      .spyOn(process.hrtime, 'bigint')
      .mockReturnValueOnce(BigInt(0))
      .mockReturnValueOnce(BigInt(2_000_000));

    middleware.use(
      {
        method: 'GET',
        baseUrl: '/api',
        route: { path: '/profesor/materia/:id/alumnos' },
        originalUrl: '/api/profesor/materia/42/alumnos?token=secret-value',
        correlationId: 'correlation-2',
      } as any,
      response as any,
      jest.fn(),
    );
    response.emit('finish');

    const logged = String(warn.mock.calls[0][0]);
    expect(logged).toContain('/api/profesor/materia/:id/alumnos');
    expect(logged).not.toContain('42');
    expect(logged).not.toContain('secret-value');
  });
});
