import { ForbiddenException } from '@nestjs/common';
import { SemanaController } from './semana.controller';

describe('SemanaController - vista como alumno', () => {
  const semana = {
    id: 12,
    cursada: { id: 7, materia: { id: 4 } },
    comisiones: [{ id: 2 }, { id: 3 }],
    fechasClasePorComision: { '2': '2026-08-25', '3': '2026-08-26' },
  };
  const semanaService: any = {
    findOne: jest.fn(),
    findVisiblesParaAlumno: jest.fn(),
  };
  const usuarioService: any = {
    obtenerOCrearUsuario: jest.fn().mockResolvedValue({ id: 50 }),
  };
  const profesorService: any = { verificarAccesoProfesor: jest.fn() };
  const controller = new SemanaController(
    semanaService,
    usuarioService,
    profesorService,
    {} as any,
    {} as any,
    {} as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    semanaService.findOne.mockResolvedValue(structuredClone(semana));
    profesorService.verificarAccesoProfesor.mockResolvedValue(true);
  });

  it('devuelve el detalle filtrado cuando la semana es visible', async () => {
    semanaService.findVisiblesParaAlumno.mockResolvedValue([{ id: 12 }]);
    const req = { user: { realm_access: { roles: ['docente'] } } };

    const result = await controller.findOneAsStudent(req, 12, 2);

    expect(result.comisiones).toEqual([{ id: 2 }]);
    expect(result.fechasClasePorComision).toEqual({ '2': '2026-08-25' });
    expect(semanaService.findVisiblesParaAlumno).toHaveBeenCalledWith(7, 2);
  });

  it('rechaza una semana futura o ajena a la comisión', async () => {
    semanaService.findVisiblesParaAlumno.mockResolvedValue([]);
    const req = { user: { realm_access: { roles: ['docente'] } } };

    await expect(
      controller.findOneAsStudent(req, 12, 2),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
