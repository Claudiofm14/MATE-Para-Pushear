import { of, throwError } from 'rxjs';
import { AuditInterceptor } from '../modules/materia-log/audit.interceptor';
import { MateriaLogAction } from '../entities/materia-log.entity';

function executionContext(request: any, response: any = { statusCode: 200 }) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as any;
}

describe('AuditInterceptor', () => {
  it('persists successful write operations with actor, IP, user agent and correlation id', (done) => {
    const materiaLogService = { create: jest.fn(async () => undefined) };
    const interceptor = new AuditInterceptor(materiaLogService as any);
    const request = {
      method: 'POST',
      path: '/material-academico',
      route: { path: '/material-academico' },
      params: {},
      body: { materiaId: 10, titulo: 'Nuevo', token: 'secret-token' },
      usuario: { id: 1, nombre: 'Admin', apellido: 'QA', email: 'admin@test' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest-agent' },
      correlationId: 'corr-1',
    };

    interceptor
      .intercept(executionContext(request), {
        handle: () => of({ ok: true }),
      } as any)
      .subscribe({
        complete: () => {
          expect(materiaLogService.create).toHaveBeenCalledWith(
            expect.objectContaining({
              materiaId: 10,
              usuarioId: 1,
              action: MateriaLogAction.CREATED,
              result: 'success',
              ipAddress: '127.0.0.1',
              userAgent: 'jest-agent',
              correlationId: 'corr-1',
              newValues: expect.objectContaining({ token: '[REDACTED]' }),
            }),
          );
          done();
        },
      });
  });

  it('persists failed write operations and stores the error message', (done) => {
    const materiaLogService = { create: jest.fn(async () => undefined) };
    const interceptor = new AuditInterceptor(materiaLogService as any);
    const request = {
      method: 'DELETE',
      path: '/materia/10',
      route: { path: '/materia/:id' },
      params: { id: 10 },
      body: {},
      usuario: { id: 1, nombre: 'Admin', apellido: 'QA', email: 'admin@test' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest-agent' },
      correlationId: 'corr-2',
    };

    interceptor
      .intercept(executionContext(request), {
        handle: () => throwError(() => new Error('Forbidden test error')),
      } as any)
      .subscribe({
        error: () => {
          expect(materiaLogService.create).toHaveBeenCalledWith(
            expect.objectContaining({
              materiaId: 10,
              action: MateriaLogAction.DELETED,
              result: 'failed',
              error: 'Forbidden test error',
              correlationId: 'corr-2',
            }),
          );
          done();
        },
      });
  });

  it('does not audit read operations or auth routes', () => {
    const materiaLogService = { create: jest.fn(async () => undefined) };
    const interceptor = new AuditInterceptor(materiaLogService as any);

    interceptor.intercept(
      executionContext({ method: 'GET', path: '/materia', body: {} }),
      {
        handle: () => of({ ok: true }),
      } as any,
    );
    interceptor.intercept(
      executionContext({ method: 'POST', path: '/auth/signout', body: {} }),
      {
        handle: () => of({ ok: true }),
      } as any,
    );

    expect(materiaLogService.create).not.toHaveBeenCalled();
  });
});
