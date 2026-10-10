import { readFileSync } from 'fs';
import { join } from 'path';

const sourceRoot = join(__dirname, '..');

function readModuleController(relativePath: string) {
  return readFileSync(join(sourceRoot, relativePath), 'utf8');
}

function methodBlock(source: string, handler: string) {
  const start = source.indexOf(`async ${handler}(`);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = source.indexOf('\n  @ApiOperation', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

describe('authorization invariants extracted from controllers', () => {
  it.each([
    ['modules/semana/semana.controller.ts', 'findAll'],
    ['modules/video/video.controller.ts', 'findAll'],
    ['modules/ejercicio/ejercicio.controller.ts', 'findAll'],
    ['modules/horario/horario.controller.ts', 'findAll'],
    ['modules/cursada/cursada.controller.ts', 'findAll'],
    ['modules/comision/comision.controller.ts', 'findAll'],
    [
      'modules/contrato-pedagogico/contrato-pedagogico.controller.ts',
      'findAll',
    ],
    ['modules/material/material.controller.ts', 'findAll'],
    ['modules/inicio/inicio.controller.ts', 'findAll'],
    ['modules/contenedor/contenedor.controller.ts', 'findAll'],
  ])('%s global read endpoint is admin-only', (file) => {
    const source = readModuleController(file);
    const findAllIndex = source.indexOf('async findAll(');
    const decorators = source.slice(
      Math.max(0, findAllIndex - 350),
      findAllIndex,
    );

    expect(decorators).toContain('@Roles(USER_ROLES.ADMIN)');
  });

  it.each([
    ['modules/video/video.controller.ts', 'findOne', 'assertCanRead'],
    [
      'modules/video/video.controller.ts',
      'findBySemana',
      'assertCanReadSemana',
    ],
    [
      'modules/video/video.controller.ts',
      'findByMateria',
      'assertCanReadMateria',
    ],
    [
      'modules/ejercicio/ejercicio.controller.ts',
      'findOne',
      'assertCanReadSemana',
    ],
    [
      'modules/ejercicio/ejercicio.controller.ts',
      'findBySemana',
      'assertCanReadSemana',
    ],
    ['modules/horario/horario.controller.ts', 'findOne', 'assertCanReadSemana'],
    [
      'modules/horario/horario.controller.ts',
      'findBySemana',
      'assertCanReadSemana',
    ],
    [
      'modules/cursada/cursada.controller.ts',
      'findOne',
      'assertCanReadCursada',
    ],
    [
      'modules/cursada/cursada.controller.ts',
      'findByMateria',
      'assertCanReadMateria',
    ],
    [
      'modules/comision/comision.controller.ts',
      'findOne',
      'assertCanReadComision',
    ],
    [
      'modules/contrato-pedagogico/contrato-pedagogico.controller.ts',
      'findOne',
      'assertCanReadMateria',
    ],
    [
      'modules/material/material.controller.ts',
      'findOne',
      'assertCanReadMateria',
    ],
    [
      'modules/inicio/inicio.controller.ts',
      'findOne',
      'verificarAccesoMateria',
    ],
    [
      'modules/materia/materia.controller.ts',
      'getConfiguracion',
      'assertCanReadMateria',
    ],
  ])(
    '%s %s validates ownership before returning data',
    (file, handler, guardCall) => {
      const source = readModuleController(file);
      expect(methodBlock(source, handler)).toContain(guardCall);
    },
  );

  it('public materia catalogue only exposes public fields', () => {
    const service = readModuleController('modules/materia/materia.service.ts');
    const publicSelect = service.slice(
      service.indexOf('materiaPublicSelect'),
      service.indexOf('constructor('),
    );

    expect(publicSelect).toContain('id: true');
    expect(publicSelect).toContain('nombre: true');
    expect(publicSelect).toContain('codigo: true');
    expect(publicSelect).not.toContain('configuracion: true');
  });
});
