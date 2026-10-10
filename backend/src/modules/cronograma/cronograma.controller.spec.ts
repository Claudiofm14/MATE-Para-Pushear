import { ForbiddenException } from '@nestjs/common';
import { CronogramaController } from './cronograma.controller';

describe('CronogramaController - permisos', () => {
  const service: any = {
    getCursada: jest.fn(),
    findByCursada: jest.fn(),
  };
  const usuarioService: any = {
    obtenerOCrearUsuario: jest.fn().mockResolvedValue({ id: 50 }),
  };
  const profesorService: any = { verificarAccesoProfesor: jest.fn() };
  const logService: any = {};
  const enrollmentQuery: any = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const enrollmentRepository: any = {
    createQueryBuilder: jest.fn(() => enrollmentQuery),
  };
  let controller: CronogramaController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CronogramaController(
      service,
      usuarioService,
      profesorService,
      logService,
      enrollmentRepository,
    );
    service.getCursada.mockResolvedValue({ materia: { id: 4 } });
    service.findByCursada.mockResolvedValue([]);
  });

  it('ignora el comisionId enviado por un alumno y usa su inscripción aprobada', async () => {
    enrollmentQuery.getOne.mockResolvedValue({ comisionId: 3 });
    const req = { user: { realm_access: { roles: ['alumno'] } } };
    await controller.findByCursada(req, 8, { comisionId: 999 });
    expect(service.findByCursada).toHaveBeenCalledWith(8, 3);
  });

  it('rechaza al alumno sin inscripción aprobada', async () => {
    enrollmentQuery.getOne.mockResolvedValue(null);
    const req = { user: { realm_access: { roles: ['alumno'] } } };
    await expect(controller.findByCursada(req, 8, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('permite al docente asignado filtrar por una comisión', async () => {
    profesorService.verificarAccesoProfesor.mockResolvedValue(true);
    const req = { user: { realm_access: { roles: ['docente'] } } };
    await controller.findByCursada(req, 8, { comisionId: 6 });
    expect(service.findByCursada).toHaveBeenCalledWith(8, 6);
  });
});
