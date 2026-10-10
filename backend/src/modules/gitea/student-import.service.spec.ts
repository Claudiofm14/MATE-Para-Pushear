import { DataSource } from 'typeorm';
import { createGiteaUser, getGiteaUserByUsername } from '../../lib/gitea';
import { StudentImportService } from './student-import.service';
import { NormalizedStudent } from './student-import.types';

jest.mock('../../lib/gitea', () => ({
  createGiteaUser: jest.fn(),
  getGiteaUserByUsername: jest.fn(),
  mapGiteaError: jest.fn(() => ({ status: 500, message: 'Error de Gitea' })),
}));

describe('StudentImportService', () => {
  const student: NormalizedStudent = {
    rowNumber: 2,
    firstName: 'Ana',
    lastName: 'Alumno',
    fullName: 'Ana Alumno',
    email: 'ana@unahur.edu.ar',
    legajo: '40111222',
    username: 'ana.alumno',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getGiteaUserByUsername).mockResolvedValue(null);
    jest.mocked(createGiteaUser).mockResolvedValue({} as never);
  });

  it('persiste el legajo al crear una cuenta desde la importacion Gitea', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const dataSource = {
      getRepository: jest.fn(() => repository),
    } as unknown as DataSource;
    const service = new StudentImportService(dataSource);

    const result = await (service as any).createStudentInGitea(student);

    expect(result).toMatchObject({ status: 'created' });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: student.email,
        legajo: student.legajo,
      }),
      { reload: false },
    );
  });
});
