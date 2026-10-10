import { Comision } from '../../entities/comision.entity';
import { CronogramaFilaComision } from '../../entities/cronograma-fila-comision.entity';
import { CronogramaFila } from '../../entities/cronograma-fila.entity';
import { Cursada } from '../../entities/cursada.entity';
import { CursadaService } from './cursada.service';

describe('CursadaService - duplicación de cronograma', () => {
  it('copia filas usando las nuevas comisiones equivalentes, no los IDs originales', async () => {
    const original = {
      id: 1,
      titulo: 'Original',
      materia: { id: 5 },
      materiaId: 5,
    };
    // duplicate() trae cada coleccion en su propia consulta (evita el
    // producto cartesiano entre colecciones hermanas), asi que estos repos
    // devuelven lo que antes venia embebido en `original`.
    const comisionesOriginales = [{ id: 10, nombre: 'Comisión A' }];
    const cronogramaFilasOriginales = [
      {
        numeroSemana: 1,
        fecha: '2026-08-22',
        hora: '10:00',
        actividades: 'Clase',
        temas: 'Tema',
        tareas: 'Tarea',
        comisiones: [{ comisionId: 10, modalidad: 'virtual' }],
      },
    ];
    const sourceCursadaRepo: any = {
      findOne: jest.fn().mockResolvedValue(original),
    };
    const sourceComisionRepo: any = {
      find: jest.fn().mockResolvedValue(comisionesOriginales),
    };
    const sourceSemanaRepo: any = { find: jest.fn().mockResolvedValue([]) };
    const sourceCronogramaRepo: any = {
      find: jest.fn().mockResolvedValue(cronogramaFilasOriginales),
    };
    const cursadaRepo: any = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 20 })),
      findOneOrFail: jest.fn(async () => ({ id: 20 })),
    };
    const comisionRepo: any = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 30 })),
    };
    const filaRepo: any = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 40 })),
    };
    const relacionRepo: any = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const emptyRepo: any = { create: jest.fn(), save: jest.fn() };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Cursada) return cursadaRepo;
        if (entity === Comision) return comisionRepo;
        if (entity === CronogramaFila) return filaRepo;
        if (entity === CronogramaFilaComision) return relacionRepo;
        return emptyRepo;
      }),
    };
    const dataSource: any = {
      transaction: jest.fn(async (callback) => callback(manager)),
      getRepository: jest.fn((entity) =>
        entity === CronogramaFila ? sourceCronogramaRepo : emptyRepo,
      ),
    };
    const service = new CursadaService(
      sourceCursadaRepo,
      {} as any, // materiaRepository
      sourceComisionRepo,
      sourceSemanaRepo,
      {} as any, // videoRepository (sin semanas, no se consulta)
      {} as any, // ejercicioRepository
      {} as any, // horarioRepository
      dataSource,
    );

    await service.duplicate(1);

    expect(relacionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cronogramaFilaId: 40,
        comisionId: 30,
        modalidad: 'virtual',
      }),
    );
    expect(relacionRepo.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ comisionId: 10 }),
    );
  });
});
