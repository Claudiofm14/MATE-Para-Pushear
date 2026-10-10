import { ComisionController } from './comision.controller';

describe('ComisionController', () => {
  const comisiones = [{ id: 7, nombre: 'Comision 1' }];
  const comisionService = {
    findByCursada: jest.fn(),
  };
  const cursadaService = {
    findByMateria: jest.fn(),
  };

  const controller = new ComisionController(
    comisionService as any,
    {} as any,
    {} as any,
    {} as any,
    cursadaService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('consulta explicitamente las comisiones de la cursada activa', async () => {
    cursadaService.findByMateria.mockResolvedValue([
      { id: 4, activa: false },
      { id: 9, activa: true },
    ]);
    comisionService.findByCursada.mockResolvedValue(comisiones);

    await expect(controller.findByMateriaForInscripcion(2)).resolves.toBe(
      comisiones,
    );
    expect(comisionService.findByCursada).toHaveBeenCalledWith(9);
  });

  it('devuelve una lista vacia cuando no existe una cursada activa', async () => {
    cursadaService.findByMateria.mockResolvedValue([{ id: 4, activa: false }]);

    await expect(controller.findByMateriaForInscripcion(2)).resolves.toEqual(
      [],
    );
    expect(comisionService.findByCursada).not.toHaveBeenCalled();
  });
});
