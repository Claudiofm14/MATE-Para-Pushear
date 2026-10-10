import { BadRequestException } from '@nestjs/common';
import { CronogramaModalidad } from '../../entities/cronograma-fila-comision.entity';
import { CronogramaService } from './cronograma.service';

describe('CronogramaService', () => {
  const filaRepository: any = {};
  const cursadaRepository: any = { findOne: jest.fn() };
  const comisionQuery: any = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  };
  const comisionRepository: any = {
    createQueryBuilder: jest.fn(() => comisionQuery),
  };
  const dataSource: any = { transaction: jest.fn() };
  let service: CronogramaService;

  const dto = {
    numeroSemana: 2,
    fecha: '2026-08-22', // sábado: debe ser válido
    hora: '10:30',
    actividades: '<b>Laboratorio</b>',
    temas: 'Transacciones',
    tareas: 'Resolver guía',
    comisiones: [
      { comisionId: 10, modalidad: CronogramaModalidad.PRESENCIAL },
      { comisionId: 11, modalidad: CronogramaModalidad.VIRTUAL },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CronogramaService(
      filaRepository,
      cursadaRepository,
      comisionRepository,
      dataSource,
    );
    jest.spyOn(service, 'getCursada').mockResolvedValue({ id: 1 } as any);
  });

  it('crea una fila de sábado con varias comisiones y modalidades diferentes', async () => {
    comisionQuery.getCount.mockResolvedValue(2);
    const filaRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 7 })),
      findOneOrFail: jest.fn(async () => ({ id: 7 })),
    };
    const relationRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    dataSource.transaction.mockImplementation(async (callback: any) =>
      callback({
        getRepository: jest
          .fn()
          .mockReturnValueOnce(filaRepo)
          .mockReturnValueOnce(relationRepo)
          .mockReturnValueOnce(filaRepo),
      }),
    );

    await expect(service.create(1, dto)).resolves.toEqual({ id: 7 });
    expect(filaRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        actividades: 'Laboratorio',
        fecha: '2026-08-22',
      }),
    );
    expect(relationRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({ comisionId: 10, modalidad: 'presencial' }),
      expect.objectContaining({ comisionId: 11, modalidad: 'virtual' }),
    ]);
  });

  it('rechaza una comisión duplicada antes de abrir la transacción', async () => {
    await expect(
      service.create(1, {
        ...dto,
        comisiones: [dto.comisiones[0], dto.comisiones[0]],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rechaza una comisión de otra cursada', async () => {
    comisionQuery.getCount.mockResolvedValue(1);
    await expect(service.create(1, dto)).rejects.toThrow(
      'Una o más comisiones no pertenecen a la cursada',
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rechaza fechas inexistentes', async () => {
    await expect(
      service.create(1, { ...dto, fecha: '2026-02-30' }),
    ).rejects.toThrow('La fecha no es válida');
  });

  it('propaga el error transaccional para permitir rollback', async () => {
    comisionQuery.getCount.mockResolvedValue(2);
    dataSource.transaction.mockRejectedValue(new Error('rollback'));
    await expect(service.create(1, dto)).rejects.toThrow('rollback');
  });

  it('rechaza filtrar el cronograma con una comisión de otra cursada', async () => {
    comisionQuery.getCount.mockResolvedValue(0);

    await expect(service.findByCursada(1, 99)).rejects.toThrow(
      'La comision seleccionada no pertenece a la cursada',
    );
  });
});
