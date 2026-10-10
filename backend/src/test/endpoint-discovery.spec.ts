import { readFileSync } from 'fs';
import { join } from 'path';
import {
  discoverEndpoints,
  writeEndpointReport,
} from './helpers/endpoint-discovery';

function handlerBlock(file: string, handler: string) {
  const source = readFileSync(join(__dirname, '..', file), 'utf8');
  const start = source.indexOf(`async ${handler}(`);
  if (start < 0) return '';
  const next = source.indexOf('\n  @ApiOperation', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

describe('automatic endpoint discovery', () => {
  const endpoints = discoverEndpoints();

  beforeAll(() => {
    writeEndpointReport(endpoints);
  });

  it('discovers every controller endpoint for coverage reporting', () => {
    expect(endpoints.length).toBeGreaterThan(50);
    expect(endpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: 'GET', path: '/semana' }),
        expect.objectContaining({ method: 'GET', path: '/video/:id' }),
        expect.objectContaining({
          method: 'GET',
          path: '/api/materia/:id/planilla-seguimiento',
        }),
        expect.objectContaining({ method: 'GET', path: '/api/admin/usuarios' }),
      ]),
    );
  });

  it('keeps every protected non-public endpoint behind roles or explicit ownership validation', () => {
    const publicEndpoints = new Set([
      '/',
      '/health',
      '/auth/config',
      '/materia',
      '/materia/:id',
      '/materia/codigo/:codigo',
    ]);
    const violations = endpoints.filter((endpoint) => {
      if (
        endpoint.isPublic ||
        publicEndpoints.has(endpoint.path) ||
        endpoint.roles.length > 0
      ) {
        return false;
      }

      const block = handlerBlock(endpoint.file, endpoint.handler);
      return !/assertCan|verificarAcceso|findVisiblesParaAlumno|obtenerOCrearUsuario|req\.user|@Request/.test(
        block,
      );
    });

    expect(violations).toEqual([]);
  });

  it('marks all mutating endpoints as authenticated and non-public', () => {
    const signedPublicWebhooks = new Set(['/api/webhooks/gitea']);
    const mutating = endpoints.filter((endpoint) =>
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(endpoint.method),
    );

    expect(mutating).not.toHaveLength(0);
    expect(
      mutating.filter(
        (endpoint) =>
          endpoint.isPublic && !signedPublicWebhooks.has(endpoint.path),
      ),
    ).toEqual([]);
  });
});
