import {
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { Repository } from 'typeorm';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { AvanceEjercicio } from '../../entities/avance-ejercicio.entity';
import { Comision } from '../../entities/comision.entity';
import { Cursada } from '../../entities/cursada.entity';
import { Ejercicio } from '../../entities/ejercicio.entity';
import { SemanaService } from '../semana/semana.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { UsuarioService } from '../usuario/usuario.service';
import { AvanceController } from './avance.controller';
import { AvanceService } from './avance.service';

describe('avance de cursada: acceso, ramas y persistencia', () => {
  const alumno = { id: 10, rol: 'alumno' };
  const docente = { id: 20, rol: 'docente' };
  let service: AvanceService;
  let registros: Array<{
    alumnoId: number;
    cursadaId: number;
    ejercicioId: number;
    completadoEn: Date;
  }>;
  let cursadaRepo: { findOne: jest.Mock };
  let inscripcionRepo: { findOne: jest.Mock };
  let comisionRepo: { findOne: jest.Mock };
  let ejercicioRepo: { find: jest.Mock };
  let avanceRepo: {
    find: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let semanas: {
    findByCursada: jest.Mock;
    findByComision: jest.Mock;
    findVisiblesParaAlumno: jest.Mock;
  };
  let profesores: { verificarAccesoProfesor: jest.Mock };
  let insertValues: jest.Mock;

  beforeEach(() => {
    registros = [];
    cursadaRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 7,
        titulo: 'Cursada 2026',
        materia: { id: 1, nombre: 'Materiales Tecnológicos' },
      }),
    };
    inscripcionRepo = {
      findOne: jest.fn().mockResolvedValue({ comisionId: 5 }),
    };
    comisionRepo = { findOne: jest.fn().mockResolvedValue({ id: 5 }) };
    const weeks = [
      { id: 103, numeroSemana: 3, titulo: 'Evaluación' },
      { id: 101, numeroSemana: 1, titulo: 'Materiales' },
      { id: 102, numeroSemana: 2, titulo: 'Selección' },
    ];
    semanas = {
      findByCursada: jest.fn().mockImplementation(async () => [...weeks]),
      findByComision: jest.fn().mockImplementation(async () => [...weeks]),
      findVisiblesParaAlumno: jest
        .fn()
        .mockImplementation(async () => [...weeks]),
    };
    ejercicioRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 1, titulo: 'Metales', descripcion: 'TP 1', semana: { id: 101 } },
        {
          id: 2,
          titulo: 'Polímeros',
          descripcion: 'Cuestionario',
          semana: { id: 101 },
        },
        {
          id: 3,
          titulo: 'Cerámicos',
          descripcion: 'Informe',
          semana: { id: 102 },
        },
        {
          id: 4,
          titulo: 'Selección de materiales',
          descripcion: 'Foro',
          semana: { id: 102 },
        },
        {
          id: 5,
          titulo: 'Parcial',
          descripcion: 'Evaluación',
          semana: { id: 103 },
        },
      ]),
    };
    let values: { alumnoId: number; cursadaId: number; ejercicioId: number };
    const builder = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockImplementation((value) => {
        values = value;
        return builder;
      }),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockImplementation(async () => {
        if (
          !registros.some(
            (row) =>
              row.alumnoId === values.alumnoId &&
              row.cursadaId === values.cursadaId &&
              row.ejercicioId === values.ejercicioId,
          )
        ) {
          registros.push({
            ...values,
            completadoEn: new Date('2026-10-13T12:00:00Z'),
          });
        }
      }),
    };
    insertValues = builder.values;
    avanceRepo = {
      find: jest
        .fn()
        .mockImplementation(async ({ where }) =>
          registros.filter(
            (row) =>
              row.alumnoId === where.alumnoId &&
              row.cursadaId === where.cursadaId,
          ),
        ),
      delete: jest.fn().mockImplementation(async (where) => {
        registros = registros.filter(
          (row) =>
            row.alumnoId !== where.alumnoId ||
            row.cursadaId !== where.cursadaId,
        );
      }),
      createQueryBuilder: jest.fn().mockReturnValue(builder),
    };
    profesores = { verificarAccesoProfesor: jest.fn().mockResolvedValue(true) };
    service = new AvanceService(
      cursadaRepo as unknown as Repository<Cursada>,
      inscripcionRepo as unknown as Repository<AlumnoMateria>,
      comisionRepo as unknown as Repository<Comision>,
      ejercicioRepo as unknown as Repository<Ejercicio>,
      avanceRepo as unknown as Repository<AvanceEjercicio>,
      semanas as unknown as SemanaService,
      profesores as unknown as ProfesorMateriaService,
    );
  });

  it('desbloquea ramas independientes y exige ambas antes de una unión', async () => {
    let mapa = await service.obtener(7, alumno, ['alumno']);
    expect(mapa.nodos.map((nodo) => nodo.estado)).toEqual([
      'pendiente',
      'pendiente',
      'bloqueado',
      'bloqueado',
      'bloqueado',
    ]);
    mapa = await service.completar(7, 1, alumno, ['alumno']);
    expect(mapa.nodos.map((nodo) => nodo.estado)).toEqual([
      'entregado',
      'pendiente',
      'pendiente',
      'bloqueado',
      'bloqueado',
    ]);
    await service.completar(7, 3, alumno, ['alumno']);
    await service.completar(7, 2, alumno, ['alumno']);
    await expect(
      service.completar(7, 5, alumno, ['alumno']),
    ).rejects.toBeInstanceOf(ForbiddenException);
    mapa = await service.completar(7, 4, alumno, ['alumno']);
    expect(mapa.nodos[mapa.nodos.length - 1]?.estado).toBe('pendiente');
  });

  it('rechaza entregas bloqueadas o ajenas antes de escribir', async () => {
    await expect(
      service.completar(7, 3, alumno, ['alumno']),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.completar(7, 999, alumno, ['alumno']),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it('conserva la entrega y su fecha al reintentar y al volver a cargar', async () => {
    await service.completar(7, 1, alumno, ['alumno']);
    await service.completar(7, 1, alumno, ['alumno']);
    const mapa = await service.obtener(7, alumno, ['alumno']);
    expect(mapa.nodos[0].completadoEn).toEqual(
      new Date('2026-10-13T12:00:00Z'),
    );
    expect(insertValues).toHaveBeenCalledTimes(1);
  });

  it('fuerza la comisión del alumno y consulta sólo semanas publicadas', async () => {
    const mapa = await service.obtener(7, alumno, ['alumno'], 999);
    expect(mapa.comisionId).toBe(5);
    expect(semanas.findVisiblesParaAlumno).toHaveBeenCalledWith(7, 5);
    expect(semanas.findByCursada).not.toHaveBeenCalled();
    expect(inscripcionRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          alumnoId: 10,
          materiaId: 1,
          estado: 'aprobado',
          comision: { cursada: { id: 7 } },
        }),
      }),
    );
  });

  it('reinicia sólo el avance del alumno y de la cursada solicitada', async () => {
    registros.push(
      { alumnoId: 10, cursadaId: 7, ejercicioId: 1, completadoEn: new Date() },
      { alumnoId: 11, cursadaId: 7, ejercicioId: 1, completadoEn: new Date() },
      { alumnoId: 10, cursadaId: 8, ejercicioId: 1, completadoEn: new Date() },
    );
    const mapa = await service.reiniciar(7, alumno, ['alumno']);
    expect(mapa.nodos.some((nodo) => nodo.estado === 'entregado')).toBe(false);
    expect(registros).toHaveLength(2);
    expect(avanceRepo.delete).toHaveBeenCalledWith({
      alumnoId: 10,
      cursadaId: 7,
    });
  });

  it('no mezcla entregas de otros alumnos ni de otras cursadas', async () => {
    registros.push(
      { alumnoId: 11, cursadaId: 7, ejercicioId: 1, completadoEn: new Date() },
      { alumnoId: 10, cursadaId: 8, ejercicioId: 2, completadoEn: new Date() },
    );
    expect(
      (await service.obtener(7, alumno, ['alumno'])).nodos.filter(
        (nodo) => nodo.estado === 'entregado',
      ),
    ).toHaveLength(0);
  });

  it('simula para docentes autorizados sin permitir persistir o borrar avance', async () => {
    expect((await service.obtener(7, docente, ['docente'], 5)).simulacion).toBe(
      true,
    );
    expect(semanas.findByComision).toHaveBeenCalledWith(5);
    expect(avanceRepo.find).not.toHaveBeenCalled();
    await expect(
      service.completar(7, 1, docente, ['docente']),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.reiniciar(7, docente, ['docente']),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(avanceRepo.delete).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });

  it('rechaza una comisión de otra cursada en la simulación', async () => {
    comisionRepo.findOne.mockResolvedValue(null);
    await expect(
      service.obtener(7, docente, ['docente'], 999),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(ejercicioRepo.find).not.toHaveBeenCalled();
  });

  it('rechaza alumnos sin inscripción y docentes de otra materia', async () => {
    inscripcionRepo.findOne.mockResolvedValue(null);
    profesores.verificarAccesoProfesor.mockResolvedValue(false);
    await expect(service.obtener(7, alumno, ['alumno'])).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.obtener(7, docente, ['docente']),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(ejercicioRepo.find).not.toHaveBeenCalled();
  });

  it('resuelve correctamente recorridos vacíos sin consultar todos los ejercicios', async () => {
    semanas.findVisiblesParaAlumno.mockResolvedValue([]);
    expect((await service.obtener(7, alumno, ['alumno'])).nodos).toEqual([]);
    expect(ejercicioRepo.find).not.toHaveBeenCalled();
  });

  it('conecta semanas con actividades aunque haya semanas vacías en el medio', async () => {
    semanas.findVisiblesParaAlumno.mockResolvedValue([
      { id: 101, numeroSemana: 1, titulo: 'Primera' },
      { id: 104, numeroSemana: 2, titulo: 'Sólo teoría' },
      { id: 103, numeroSemana: 3, titulo: 'Última' },
    ]);
    const mapa = await service.obtener(7, alumno, ['alumno']);
    expect(mapa.nodos[mapa.nodos.length - 1]?.requisitos).toEqual([1, 2]);
  });

  it('verifica rutas HTTP, validación de parámetros y persistencia de la respuesta', async () => {
    const module = await Test.createTestingModule({
      controllers: [AvanceController],
      providers: [
        { provide: AvanceService, useValue: service },
        {
          provide: UsuarioService,
          useValue: {
            obtenerOCrearUsuario: jest.fn().mockResolvedValue(alumno),
          },
        },
      ],
    }).compile();
    const app = module.createNestApplication();
    app.use((req, _res, next) => {
      req.user = { realm_access: { roles: ['alumno'] } };
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
    try {
      await request(app.getHttpServer())
        .get('/avance/cursada/7?comisionId=invalid')
        .expect(400);
      await request(app.getHttpServer())
        .put('/avance/cursada/7/ejercicio/3')
        .expect(403);
      const saved = await request(app.getHttpServer())
        .put('/avance/cursada/7/ejercicio/1')
        .expect(200);
      expect(saved.body.nodos[0].estado).toBe('entregado');
      expect(saved.body.nodos[2].estado).toBe('pendiente');
      const loaded = await request(app.getHttpServer())
        .get('/avance/cursada/7')
        .expect(200);
      expect(loaded.body.nodos[0].completadoEn).toBe(
        '2026-10-13T12:00:00.000Z',
      );
      await request(app.getHttpServer())
        .delete('/avance/cursada/7/completadas')
        .expect(200);
      expect(registros).toHaveLength(0);
    } finally {
      await app.close();
    }
  });
});
