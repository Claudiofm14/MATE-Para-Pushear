import { USER_ROLES } from '../../auth/constants/roles.constant';

export const testUsers = {
  admin: {
    id: 1,
    email: 'admin@test.unahur.edu.ar',
    nombre: 'Admin',
    apellido: 'QA',
    authProviderId: 'auth-admin',
  },
  docenteA: {
    id: 2,
    email: 'docente.a@test.unahur.edu.ar',
    nombre: 'Docente',
    apellido: 'A',
    authProviderId: 'auth-docente-a',
  },
  docenteB: {
    id: 3,
    email: 'docente.b@test.unahur.edu.ar',
    nombre: 'Docente',
    apellido: 'B',
    authProviderId: 'auth-docente-b',
  },
  alumno1: {
    id: 4,
    email: 'alumno1@test.unahur.edu.ar',
    nombre: 'Alumno',
    apellido: 'Uno',
    authProviderId: 'auth-alumno-1',
  },
  alumno2: {
    id: 5,
    email: 'alumno2@test.unahur.edu.ar',
    nombre: 'Alumno',
    apellido: 'Dos',
    authProviderId: 'auth-alumno-2',
  },
  alumno3: {
    id: 6,
    email: 'alumno3@test.unahur.edu.ar',
    nombre: 'Alumno',
    apellido: 'Tres',
    authProviderId: 'auth-alumno-3',
  },
};

export const testAcademicGraph = {
  materiaA: { id: 10, nombre: 'Materia A', codigo: 'MAT-A' },
  materiaB: { id: 20, nombre: 'Materia B', codigo: 'MAT-B' },
  cursadaA: { id: 100, materia: { id: 10 }, materiaId: 10 },
  cursadaB: { id: 200, materia: { id: 20 }, materiaId: 20 },
  comisionA: { id: 1000, cursada: { id: 100, materia: { id: 10 } } },
  comisionB: { id: 2000, cursada: { id: 200, materia: { id: 20 } } },
  semanaA1: {
    id: 10000,
    numeroSemana: 1,
    titulo: 'Semana A1',
    cursada: { id: 100, materia: { id: 10 } },
    comisiones: [{ id: 1000 }],
  },
  semanaB1: {
    id: 20000,
    numeroSemana: 1,
    titulo: 'Semana B1',
    cursada: { id: 200, materia: { id: 20 } },
    comisiones: [{ id: 2000 }],
  },
};

export function authRequest(user: keyof typeof testUsers, roles: string[]) {
  return {
    user: {
      email: testUsers[user].email,
      realm_access: { roles },
    },
  };
}

export const adminRequest = () => authRequest('admin', [USER_ROLES.ADMIN]);
export const docenteRequest = () =>
  authRequest('docenteA', [USER_ROLES.DOCENTE]);
export const alumnoRequest = () => authRequest('alumno1', [USER_ROLES.ALUMNO]);
