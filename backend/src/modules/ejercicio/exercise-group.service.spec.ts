import { ForbiddenException } from '@nestjs/common';
import { ExerciseGroupService } from './exercise-group.service';

function makeService(dataSource: any = {}) {
  return new ExerciseGroupService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    dataSource as any,
    {} as any,
    {} as any,
  );
}

describe('ExerciseGroupService domain rules', () => {
  const service = makeService();

  it('normalizes names case-insensitively and without accents', () => {
    expect((service as any).normalizeName('  Álfa   TEAM ')).toBe('alfa team');
  });

  it('blocks changes after groupsLockedAt', () => {
    expect(() =>
      (service as any).assertOpen({
        groupsLockedAt: new Date(Date.now() - 1000),
      }),
    ).toThrow(ForbiddenException);
  });

  it('blocks changes when the group is administratively locked', () => {
    expect(() =>
      (service as any).assertOpen({}, { modificationsLocked: true }),
    ).toThrow('Las modificaciones del grupo están bloqueadas');
  });

  it('allows changes before the deadline', () => {
    expect(() =>
      (service as any).assertOpen(
        { groupsLockedAt: new Date(Date.now() + 60000) },
        { modificationsLocked: false },
      ),
    ).not.toThrow();
  });
});

describe('ExerciseGroupService group repo naming (incluye profesor)', () => {
  const service = makeService();
  const fallback = 'ejercicio-1-grupo-2';

  it('incluye el nombre del grupo y del profesor en el slug', () => {
    const { name } = (service as any).buildGroupRepoName(
      'TP 1',
      'Grupo A',
      'Juan Pérez',
      fallback,
    );
    expect(name).toBe('tp-1-grupo-a-juan-perez');
  });

  it('normaliza acentos del profesor', () => {
    const { name } = (service as any).buildGroupRepoName(
      'TP',
      'G1',
      'Álvarez Ñandú',
      fallback,
    );
    expect(name).toBe('tp-g1-alvarez-nandu');
  });

  it('sin profesor devuelve el nombre legacy', () => {
    const { name, legacyName } = (service as any).buildGroupRepoName(
      'TP 1',
      'Grupo A',
      null,
      fallback,
    );
    expect(name).toBe(legacyName);
    expect(name).toBe('tp-1-grupo-a');
  });

  it('preserva el sufijo del profesor cuando titulo+grupo es largo', () => {
    const titulo = 'T'.repeat(60);
    const grupo = 'G'.repeat(60);
    const { name } = (service as any).buildGroupRepoName(
      titulo,
      grupo,
      'Perez',
      fallback,
    );
    expect(name.length).toBeLessThanOrEqual(100);
    expect(name.endsWith('-perez')).toBe(true);
  });
});

describe('ExerciseGroupService resolveTeacherSuffix', () => {
  it('prioriza al docente que creó el ejercicio', async () => {
    const getRepository = jest.fn();
    const service = makeService({ getRepository });
    const suffix = await (service as any).resolveTeacherSuffix(
      {
        createdBy: {
          nombre: 'María',
          apellido: 'López',
          githubUser: 'mlopez',
        },
        semana: { cursada: { materiaId: 7 } },
      },
      [1],
    );
    expect(suffix).toBe('María López');
    expect(getRepository).not.toHaveBeenCalled();
  });

  it('usa githubUser del creador si no tiene nombre/apellido', async () => {
    const service = makeService();
    const suffix = await (service as any).resolveTeacherSuffix(
      { createdBy: { nombre: '', apellido: '', githubUser: 'profe1' } },
      [1],
    );
    expect(suffix).toBe('profe1');
  });

  it('sin docente creador cae al fallback por comisión: nombre+apellido y solo inscripciones aprobadas', async () => {
    const alumnoFind = jest.fn().mockResolvedValue([
      { alumnoId: 1, materiaId: 7, comisionId: 10, estado: 'aprobado' },
      { alumnoId: 2, materiaId: 7, comisionId: 10, estado: 'aprobado' },
    ]);
    const profesorFindOne = jest.fn().mockResolvedValue({
      profesorMateria: {
        profesor: { nombre: 'Juan', apellido: 'Pérez', githubUser: 'jp' },
      },
    });
    const dataSource = {
      getRepository: jest.fn((entity: any) => {
        if (entity?.name === 'AlumnoMateria') return { find: alumnoFind };
        return { findOne: profesorFindOne };
      }),
    };
    const service = makeService(dataSource);
    const exercise = { semana: { cursada: { materia: { id: 7 } } } };
    const suffix = await (service as any).resolveTeacherSuffix(
      exercise,
      [1, 2],
    );
    expect(suffix).toBe('Juan Pérez');
    expect(alumnoFind).toHaveBeenCalledWith({
      where: [
        { alumnoId: 1, materiaId: 7, estado: 'aprobado' },
        { alumnoId: 2, materiaId: 7, estado: 'aprobado' },
      ],
    });
    expect(profesorFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { comisionId: 10 } }),
    );
  });

  it('elige la comision mayoritaria del grupo', async () => {
    const alumnoFind = jest.fn().mockResolvedValue([
      { alumnoId: 1, materiaId: 7, comisionId: 10, estado: 'aprobado' },
      { alumnoId: 2, materiaId: 7, comisionId: 20, estado: 'aprobado' },
      { alumnoId: 3, materiaId: 7, comisionId: 20, estado: 'aprobado' },
    ]);
    const profesorFindOne = jest.fn().mockResolvedValue({
      profesorMateria: {
        profesor: { nombre: 'Ana', apellido: 'Gomez', githubUser: 'ag' },
      },
    });
    const dataSource = {
      getRepository: jest.fn(() => ({})),
    };
    (dataSource.getRepository as jest.Mock).mockImplementation(
      (entity: any) => {
        if (entity?.name === 'AlumnoMateria') return { find: alumnoFind };
        return { findOne: profesorFindOne };
      },
    );
    const service = makeService(dataSource);
    const suffix = await (service as any).resolveTeacherSuffix(
      { semana: { cursada: { materiaId: 7 } } },
      [1, 2, 3],
    );
    expect(suffix).toBe('Ana Gomez');
    expect(profesorFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { comisionId: 20 } }),
    );
  });

  it('usa githubUser si no hay nombre/apellido y null si no hay docente', async () => {
    const withGithub = makeService({
      getRepository: (entity: any) =>
        entity?.name === 'AlumnoMateria'
          ? {
              find: jest
                .fn()
                .mockResolvedValue([
                  { alumnoId: 1, materiaId: 7, comisionId: 5 },
                ]),
            }
          : {
              findOne: jest.fn().mockResolvedValue({
                profesorMateria: {
                  profesor: { nombre: '', apellido: '', githubUser: 'profe1' },
                },
              }),
            },
    });
    await expect(
      (withGithub as any).resolveTeacherSuffix(
        { semana: { cursada: { materiaId: 7 } } },
        [1],
      ),
    ).resolves.toBe('profe1');

    const withoutTeacher = makeService({
      getRepository: (entity: any) =>
        entity?.name === 'AlumnoMateria'
          ? {
              find: jest
                .fn()
                .mockResolvedValue([
                  { alumnoId: 1, materiaId: 7, comisionId: 5 },
                ]),
            }
          : { findOne: jest.fn().mockResolvedValue(null) },
    });
    await expect(
      (withoutTeacher as any).resolveTeacherSuffix(
        { semana: { cursada: { materiaId: 7 } } },
        [1],
      ),
    ).resolves.toBeNull();
  });
});
