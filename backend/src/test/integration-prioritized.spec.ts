import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';
import { ENTITIES } from '../entities/index.entity';
import { MODULES } from '../modules/index.module';
import { USER_ROLES } from '../auth/constants/roles.constant';
import { Usuario } from '../entities/usuario.entity';
import { ProfesorMateria } from '../entities/profesor-materia.entity';
import { AlumnoMateria } from '../entities/alumno-materia.entity';
import { AlumnoMateriaService } from '../modules/usuario/alumno-materia.service';

type TestUser = {
  sub: string;
  email: string;
  name: string;
  role: string;
  preferred_username: string;
};

const users: Record<string, TestUser> = {
  admin: {
    sub: 'test-admin',
    email: 'admin@test.local',
    name: 'Admin Test',
    role: USER_ROLES.ADMIN,
    preferred_username: 'admin-test',
  },
  docente: {
    sub: 'test-docente',
    email: 'docente@test.local',
    name: 'Docente Test',
    role: USER_ROLES.DOCENTE,
    preferred_username: 'docente-test',
  },
  docente2: {
    sub: 'test-docente-2',
    email: 'docente2@test.local',
    name: 'Docente Dos',
    role: USER_ROLES.DOCENTE,
    preferred_username: 'docente-dos',
  },
  docente3: {
    sub: 'test-docente-3',
    email: 'docente3@test.local',
    name: 'Docente Tres',
    role: USER_ROLES.DOCENTE,
    preferred_username: 'docente-tres',
  },
  alumno: {
    sub: 'test-alumno',
    email: 'alumno@test.local',
    name: 'Alumno Test',
    role: USER_ROLES.ALUMNO,
    preferred_username: 'alumno-test',
  },
  alumno2: {
    sub: 'test-alumno-2',
    email: 'alumno2@test.local',
    name: 'Alumno Dos',
    role: USER_ROLES.ALUMNO,
    preferred_username: 'alumno-dos',
  },
  externo: {
    sub: 'test-externo',
    email: 'externo@test.local',
    name: 'Externo Test',
    role: USER_ROLES.ALUMNO,
    preferred_username: 'externo-test',
  },
};

function contenedor(titulo = 'Bienvenida') {
  return {
    titulo,
    subtitulo: 'Contenido de prueba',
    tipo: 'bienvenida',
  };
}

async function ensureTestDatabase() {
  const database = process.env.DATABASE_NAME || 'proyecto_materias_test';
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres',
  });

  await adminDataSource.initialize();
  try {
    const existing = await adminDataSource.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );
    if (existing.length === 0) {
      await adminDataSource.query(`CREATE DATABASE "${database}"`);
    }
  } finally {
    await adminDataSource.destroy();
  }
}

describe('prioritized backend integration coverage', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usuarioRepository: Repository<Usuario>;
  let profesorMateriaRepository: Repository<ProfesorMateria>;
  let alumnoMateriaRepository: Repository<AlumnoMateria>;
  let alumnoMateriaService: AlumnoMateriaService;

  const http = () => request(app.getHttpServer());

  const asUser = (role: keyof typeof users) => ({
    'x-test-user': role,
  });

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
    process.env.DATABASE_PORT = process.env.DATABASE_PORT || '5432';
    process.env.DATABASE_USER = process.env.DATABASE_USER || 'admin';
    process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || 'admin123';
    process.env.DATABASE_NAME = 'proyecto_materias_test';
    process.env.AUTH_ADMIN_EMAILS = 'admin@test.local';
    process.env.AUTH_ALLOW_ROLE_DOWNGRADE = 'false';

    await ensureTestDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST,
          port: Number(process.env.DATABASE_PORT),
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          entities: ENTITIES,
          synchronize: false,
          dropSchema: false,
        }),
        ...MODULES,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: any, _res: any, next: any) => {
      const key = (req.headers['x-test-user'] as string) || 'admin';
      const user = users[key] || users.admin;
      req.user = {
        sub: user.sub,
        email: user.email,
        name: user.name,
        preferred_username: user.preferred_username,
        realm_access: { roles: [user.role] },
      };
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    usuarioRepository = dataSource.getRepository(Usuario);
    profesorMateriaRepository = dataSource.getRepository(ProfesorMateria);
    alumnoMateriaRepository = dataSource.getRepository(AlumnoMateria);
    alumnoMateriaService = app.get(AlumnoMateriaService);
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  async function seedUsers() {
    await usuarioRepository.save(
      Object.values(users).map((user) =>
        usuarioRepository.create({
          authProviderId: user.sub,
          email: user.email,
          nombre: user.name.split(' ')[0],
          apellido: user.name.split(' ').slice(1).join(' '),
          githubUser: user.preferred_username,
          rol: user.role,
        }),
      ),
    );
  }

  it('executes real HTTP flows across prioritized controllers and services', async () => {
    await seedUsers();

    const materia = (
      await http()
        .post('/materia')
        .set(asUser('admin'))
        .send({ nombre: 'Objetos 2', codigo: 'OBJ2-TEST' })
        .expect(201)
    ).body;

    await http().get('/materia').expect(200);
    await http().get(`/materia/${materia.id}`).expect(200);
    await http()
      .put(`/materia/${materia.id}`)
      .set(asUser('admin'))
      .send({ nombre: 'Objetos 2 Integracion' })
      .expect(200);
    await http()
      .put(`/materia/${materia.id}/configuracion`)
      .set(asUser('admin'))
      .send({
        tabs: { inicio: true, material: true },
        pages: { inicio: { titulo: 'Inicio' } },
      })
      .expect(200);
    await http()
      .get(`/materia/${materia.id}/configuracion`)
      .set(asUser('admin'))
      .expect(200);

    const docente = await usuarioRepository.findOneByOrFail({
      authProviderId: users.docente.sub,
    });
    const alumno = await usuarioRepository.findOneByOrFail({
      authProviderId: users.alumno.sub,
    });

    await profesorMateriaRepository.save(
      profesorMateriaRepository.create({
        profesor: docente,
        profesorId: docente.id,
        materiaId: materia.id,
        materia,
        activo: true,
      } as any),
    );

    const cursada = (
      await http()
        .post('/cursada')
        .set(asUser('admin'))
        .send({
          titulo: 'Cursada Test',
          descripcion: 'Cursada para integracion',
          activa: true,
          fechaInicio: '2026-03-01',
          // Debe permanecer vigente independientemente de la fecha en que se
          // ejecute la suite; el servicio rechaza correctamente cursadas
          // activas cuya fecha de fin ya vencio.
          fechaFin: '2099-07-15',
          materiaId: materia.id,
        })
        .expect(201)
    ).body;

    await http().get('/cursada').set(asUser('admin')).expect(200);
    await http()
      .get(`/cursada/${cursada.id}`)
      .set(asUser('docente'))
      .expect(200);
    await http()
      .get(`/cursada/materia/${materia.id}`)
      .set(asUser('docente'))
      .expect(200);
    await http()
      .put(`/cursada/${cursada.id}`)
      .set(asUser('admin'))
      .send({ titulo: 'Cursada Test Actualizada', materiaId: materia.id })
      .expect(200);

    const comision = (
      await http()
        .post('/comision')
        .set(asUser('admin'))
        .send({
          nombre: 'Comision A',
          descripcion: 'Lunes',
          cursadaId: cursada.id,
        })
        .expect(201)
    ).body;

    await alumnoMateriaRepository.save(
      alumnoMateriaRepository.create({
        alumno,
        alumnoId: alumno.id,
        materia,
        materiaId: materia.id,
        comision,
        comisionId: comision.id,
        estado: 'aprobado',
      } as any),
    );

    await http().get('/comision').set(asUser('admin')).expect(200);
    await http()
      .get(`/comision/${comision.id}`)
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .get(`/comision/cursada/${cursada.id}`)
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .put(`/comision/${comision.id}`)
      .set(asUser('admin'))
      .send({ nombre: 'Comision A+', cursadaId: cursada.id })
      .expect(200);

    const comisionB = (
      await http()
        .post('/comision')
        .set(asUser('admin'))
        .send({
          nombre: 'Comision B',
          descripcion: 'Miercoles',
          cursadaId: cursada.id,
        })
        .expect(201)
    ).body;

    const importedStudent = {
      rowNumber: 2,
      firstName: 'Importado',
      lastName: 'Legajo',
      fullName: 'Importado Legajo',
      email: 'importado-legajo@test.local',
      legajo: '40111222',
      username: 'importado-legajo',
    };
    const importResult =
      await alumnoMateriaService.asignarAlumnosImportadosACursada(
        materia.id,
        comision.id,
        [importedStudent],
      );
    expect(importResult).toMatchObject({ created: 1, failed: 0 });

    const importedUser = await usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.legajo')
      .where('usuario.email = :email', { email: importedStudent.email })
      .getOneOrFail();
    expect(importedUser.legajo).toBe(importedStudent.legajo);

    const importedUserPublic = await usuarioRepository.findOneByOrFail({
      email: importedStudent.email,
    });
    expect(importedUserPublic.legajo).toBeUndefined();

    const exportedCsv = await http()
      .get(
        `/api/profesor/materia/${materia.id}/alumnos/exportar?cursadaId=${cursada.id}&format=csv`,
      )
      .set(asUser('docente'))
      .expect('Content-Type', /text\/csv/)
      .expect(200);
    expect(exportedCsv.text).toContain(importedStudent.legajo);
    expect(exportedCsv.text).toContain(importedStudent.email);
    expect(exportedCsv.text).toContain(comision.nombre);

    await http()
      .get(
        `/api/profesor/materia/${materia.id}/alumnos/exportar?cursadaId=${cursada.id}&comisionId=${comisionB.id}&format=csv`,
      )
      .set(asUser('docente'))
      .expect((response) => {
        expect(response.text).not.toContain(importedStudent.email);
      })
      .expect(200);
    await http()
      .get(
        `/api/profesor/materia/${materia.id}/alumnos/exportar?cursadaId=${cursada.id}&format=csv`,
      )
      .set(asUser('externo'))
      .expect(403);
    await http()
      .get(
        `/api/profesor/materia/${materia.id}/alumnos/exportar?cursadaId=${cursada.id}&format=pdf`,
      )
      .set(asUser('docente'))
      .expect(400);

    const semana = (
      await http()
        .post('/semana')
        .set(asUser('admin'))
        .send({
          titulo: 'Semana 1',
          descripcion: 'Intro',
          numeroSemana: 1,
          fechaInicio: '2026-03-02',
          horaInicio: '08:00',
          importante: '<strong>Leer</strong>',
          avisos: 'Sin avisos',
          contenido: {
            blocks: [{ type: 'text', data: { contenido: 'Hola' } }],
          },
          cursadaId: cursada.id,
          comisionIds: [comision.id],
        })
        .expect(201)
    ).body;

    await http().get('/semana').set(asUser('admin')).expect(200);
    await http().get(`/semana/${semana.id}`).set(asUser('alumno')).expect(200);
    await http()
      .get(`/semana/cursada/${cursada.id}`)
      .set(asUser('docente'))
      .expect(200);
    await http()
      .get(`/semana/comision/${comision.id}`)
      .set(asUser('docente'))
      .expect(200);
    await http()
      .get(`/semana/cursada/${cursada.id}/alumno/${comision.id}`)
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .put(`/semana/${semana.id}`)
      .set(asUser('admin'))
      .send({
        titulo: 'Semana 1 Actualizada',
        descripcion: 'Intro actualizada',
        numeroSemana: 1,
        fechaInicio: '2026-03-03',
        cursadaId: cursada.id,
        comisionIds: [comision.id],
      })
      .expect(200);

    const inicio = (
      await http()
        .post('/inicio')
        .set(asUser('admin'))
        .send({
          titulo: 'Inicio Test',
          materiaId: materia.id,
          contenido: { blocks: [] },
          contenedores: [contenedor()],
        })
        .expect(201)
    ).body;

    await http().get('/inicio').set(asUser('admin')).expect(200);
    await http()
      .get(`/inicio/materia/${materia.id}`)
      .set(asUser('docente'))
      .expect(200);
    await http().get(`/inicio/${inicio.id}`).set(asUser('alumno')).expect(200);
    await http()
      .put(`/inicio/${inicio.id}`)
      .set(asUser('admin'))
      .send({
        titulo: 'Inicio actualizado',
        contenedores: [contenedor('Nueva')],
      })
      .expect(200);
    await http()
      .post(`/inicio/${inicio.id}/contenedores`)
      .set(asUser('admin'))
      .send(contenedor('Extra'))
      .expect(201);

    const material = (
      await http()
        .post('/material')
        .set(asUser('admin'))
        .send({
          titulo: 'Material Test',
          materiaId: materia.id,
          contenedores: [contenedor('Material')],
        })
        .expect(201)
    ).body;

    await http().get('/material').set(asUser('admin')).expect(200);
    await http()
      .get(`/material/${material.id}`)
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .put(`/material/${material.id}`)
      .set(asUser('admin'))
      .send({ titulo: 'Material actualizado' })
      .expect(200);
    await http()
      .post(`/material/${material.id}/contenedores`)
      .set(asUser('admin'))
      .send(contenedor('Material extra'))
      .expect(201);

    const contrato = (
      await http()
        .post('/contrato-pedagogico')
        .set(asUser('admin'))
        .send({
          titulo: 'Contrato Test',
          materiaId: materia.id,
          secciones: [contenedor('Contrato')],
        })
        .expect(201)
    ).body;

    await http().get('/contrato-pedagogico').set(asUser('admin')).expect(200);
    await http()
      .get(`/contrato-pedagogico/${contrato.id}`)
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .get(`/contrato-pedagogico/${contrato.id}/secciones`)
      .set(asUser('docente'))
      .expect(200);
    await http()
      .put(`/contrato-pedagogico/${contrato.id}`)
      .set(asUser('admin'))
      .send({ titulo: 'Contrato actualizado' })
      .expect(200);

    const academico = (
      await http()
        .post('/material-academico')
        .set(asUser('admin'))
        .send({
          titulo: 'Guia',
          descripcion: '<p>Texto <script>alert(1)</script></p>',
          tipo: 'link',
          categoria: 'guias',
          url: 'https://example.com/guia',
          textoBoton: 'Abrir',
          contenido: { html: '<img src=x onerror=alert(1)>' },
          icono: 'book',
          color: 'blue',
          orden: 1,
          visible: true,
          materiaId: materia.id,
        })
        .expect(201)
    ).body;

    await http().get('/material-academico').set(asUser('alumno')).expect(200);
    await http()
      .get(`/material-academico/materia/${materia.id}`)
      .set(asUser('docente'))
      .expect(200);
    await http()
      .get('/material-academico/categoria/guias')
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .get(`/material-academico/${academico.id}`)
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .put(`/material-academico/${academico.id}`)
      .set(asUser('admin'))
      .send({
        titulo: 'Guia actualizada',
        descripcion: '<b>ok</b>',
        materiaId: materia.id,
      })
      .expect(200);
    await http()
      .put('/material-academico/reorder/batch')
      .set(asUser('admin'))
      .send([{ id: academico.id, orden: 2 }])
      .expect(200);

    const actividad = (
      await http()
        .post('/api/actividad')
        .set(asUser('admin'))
        .send({
          nombre: 'TP1',
          descripcion: 'Trabajo practico',
          repositorioBase: 'https://github.com/test/tp1',
          tipoCalificacion: 'numerico',
          materiaId: materia.id,
          comisionIds: [comision.id],
        })
        .expect(201)
    ).body;

    await http()
      .get(`/api/materia/${materia.id}/actividades`)
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .get(
        `/api/materia/${materia.id}/planilla-seguimiento?cursadaId=${cursada.id}`,
      )
      .set(asUser('docente'))
      .expect(200);
    await http()
      .put(`/api/actividad/${actividad.id}`)
      .set(asUser('admin'))
      .send({ nombre: 'TP1 actualizado', comisionIds: [comision.id] })
      .expect(200);
    await http()
      .put(`/api/entrega-actividad/${actividad.id}/${alumno.id}`)
      .set(asUser('docente'))
      .send({ notaNumerica: 9, comentario: 'Muy bien' })
      .expect(200);
    await http()
      .put('/api/entrega-actividad/bulk')
      .set(asUser('docente'))
      .send([
        {
          actividadId: actividad.id,
          alumnoId: alumno.id,
          entrega: { notaNumerica: 10, comentario: 'Excelente' },
        },
      ])
      .expect(200);

    await http()
      .get(`/material-academico/${academico.id}`)
      .set(asUser('externo'))
      .expect(403);

    await http().get('/api/usuario/me').set(asUser('alumno')).expect(200);
    await http()
      .get('/api/alumno/mis-materias')
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .get(`/api/alumno/materia/${materia.id}/estado?cursadaId=${cursada.id}`)
      .set(asUser('alumno'))
      .expect(200);
    await http()
      .get('/api/profesor/mis-materias')
      .set(asUser('docente'))
      .expect(200);
    await http()
      .get(
        `/api/profesor/materia/${materia.id}/alumnos?cursadaId=${cursada.id}`,
      )
      .set(asUser('docente'))
      .expect(200);
    await http()
      .get(`/api/profesor/comision/${comision.id}/alumnos`)
      .set(asUser('docente'))
      .expect(200);
    await http().get('/api/admin/usuarios').set(asUser('admin')).expect(200);

    const solicitudExterno = (
      await http()
        .post('/api/alumno/solicitar-inscripcion')
        .set(asUser('externo'))
        .send({ materiaId: materia.id, comisionId: comision.id })
        .expect(201)
    ).body;
    await http()
      .post('/api/alumno/solicitar-inscripcion')
      .set(asUser('externo'))
      .send({ materiaId: materia.id, comisionId: comision.id })
      .expect(409);
    await http()
      .get('/api/alumno/mis-solicitudes')
      .set(asUser('externo'))
      .expect(200);
    await http()
      .get(`/api/profesor/materia/${materia.id}/solicitudes`)
      .set(asUser('docente'))
      .expect(200);
    const externoAprobado = (
      await http()
        .post(`/api/profesor/aprobar-solicitud/${solicitudExterno.id}`)
        .set(asUser('docente'))
        .send({ mensaje: 'Aprobado por test' })
        .expect(201)
    ).body;
    await http()
      .put(`/api/profesor/alumno-materia/${externoAprobado.id}/comision`)
      .set(asUser('docente'))
      .send({ comisionId: comisionB.id })
      .expect(200);
    await http()
      .delete(`/api/profesor/alumno-materia/${externoAprobado.id}`)
      .set(asUser('docente'))
      .expect(200);

    const solicitudAlumno2 = (
      await http()
        .post('/api/alumno/solicitar-inscripcion')
        .set(asUser('alumno2'))
        .send({ materiaId: materia.id, comisionId: comision.id })
        .expect(201)
    ).body;
    await http()
      .post(`/api/profesor/rechazar-solicitud/${solicitudAlumno2.id}`)
      .set(asUser('docente'))
      .send({ mensaje: 'Sin cupo' })
      .expect(201);
    const alumno2 = await usuarioRepository.findOneByOrFail({
      authProviderId: users.alumno2.sub,
    });
    const alumno2Asignado = (
      await http()
        .post(`/api/profesor/materia/${materia.id}/asignar-alumno-cursada`)
        .set(asUser('docente'))
        .send({ alumnoId: alumno2.id, comisionId: comision.id })
        .expect(201)
    ).body;
    await http()
      .get(`/api/profesor/materia/${materia.id}/solicitudes`)
      .set(asUser('externo'))
      .expect(403);
    await http()
      .get(
        `/api/profesor/materia/${materia.id}/alumnos?cursadaId=${cursada.id}`,
      )
      .set(asUser('externo'))
      .expect(403);
    await http()
      .get(
        `/api/profesor/materia/${materia.id}/cursada/${cursada.id}/alumnos-disponibles`,
      )
      .set(asUser('externo'))
      .expect(403);
    await http()
      .post(`/api/profesor/materia/${materia.id}/asignar-alumno-cursada`)
      .set(asUser('externo'))
      .send({ alumnoId: alumno2.id, comisionId: comision.id })
      .expect(403);
    await http()
      .get(`/api/profesor/comision/${comision.id}/alumnos`)
      .set(asUser('externo'))
      .expect(403);
    await http()
      .delete(`/api/profesor/alumno-materia/${alumno2Asignado.id}`)
      .set(asUser('externo'))
      .expect(403);
    await http()
      .put(`/api/profesor/alumno-materia/${alumno2Asignado.id}/comision`)
      .set(asUser('externo'))
      .send({ comisionId: comisionB.id })
      .expect(403);
    await http()
      .delete(
        `/api/profesor/materia/${materia.id}/alumnos?cursadaId=${cursada.id}`,
      )
      .set(asUser('externo'))
      .expect(403);
    await http()
      .get(
        `/api/profesor/materia/${materia.id}/cursada/${cursada.id}/alumnos-disponibles`,
      )
      .set(asUser('docente'))
      .expect(200);
    const disponiblesPaginados = (
      await http()
        .get(
          `/api/profesor/materia/${materia.id}/cursada/${cursada.id}/alumnos-disponibles/buscar?search=externo&page=1&limit=20`,
        )
        .set(asUser('docente'))
        .expect(200)
    ).body;
    expect(disponiblesPaginados).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
    });
    expect(disponiblesPaginados.items[0]).toMatchObject({
      email: users.externo.email,
    });
    expect(disponiblesPaginados.items[0]).not.toHaveProperty('authProviderId');
    await http()
      .get(
        `/api/profesor/materia/${materia.id}/cursada/${cursada.id}/alumnos-disponibles/buscar?page=1&limit=51`,
      )
      .set(asUser('docente'))
      .expect(400);

    const solicitudAccesoRechazada = (
      await http()
        .post('/api/profesor/solicitar-acceso')
        .set(asUser('docente2'))
        .send({ materiaId: materia.id, comisionIds: [comision.id] })
        .expect(201)
    ).body;
    await http()
      .get('/api/admin/solicitudes-acceso')
      .set(asUser('admin'))
      .expect(200);
    await http()
      .post(
        `/api/admin/solicitudes-acceso/${solicitudAccesoRechazada.id}/rechazar`,
      )
      .set(asUser('admin'))
      .expect(201);

    const solicitudAccesoAprobada = (
      await http()
        .post('/api/profesor/solicitar-acceso')
        .set(asUser('docente3'))
        .send({ materiaId: materia.id, comisionIds: [comision.id] })
        .expect(201)
    ).body;
    await http()
      .post(
        `/api/admin/solicitudes-acceso/${solicitudAccesoAprobada.id}/aprobar`,
      )
      .set(asUser('admin'))
      .expect(201);

    const asignacionDocente2 = (
      await http()
        .post('/api/admin/asignar-profesor')
        .set(asUser('admin'))
        .send({
          profesorAuthProviderId: users.docente2.sub,
          materiaId: materia.id,
          comisionIds: [comision.id],
        })
        .expect(201)
    ).body;
    await http()
      .get(`/api/admin/materia/${materia.id}/profesores`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .delete(`/api/admin/remover-profesor/${asignacionDocente2.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .delete(
        `/api/profesor/materia/${materia.id}/alumnos?cursadaId=${cursada.id}`,
      )
      .set(asUser('docente'))
      .expect(200);

    await http()
      .delete(`/api/actividad/${actividad.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .delete(`/material-academico/${academico.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .delete(`/contrato-pedagogico/${contrato.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .patch(`/contrato-pedagogico/${contrato.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .delete(`/material/${material.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .patch(`/material/${material.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .delete(`/inicio/${inicio.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http().patch(`/inicio/${inicio.id}`).set(asUser('admin')).expect(200);
    await http()
      .delete(`/semana/${semana.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .patch(`/semana/${semana.id}/restore`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .delete(`/comision/${comision.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .patch(`/comision/${comision.id}/restore`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .patch(`/cursada/${cursada.id}/finalizar`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .delete(`/cursada/${cursada.id}`)
      .set(asUser('admin'))
      .expect(200);
    await http()
      .patch(`/cursada/${cursada.id}/restore`)
      .set(asUser('admin'))
      .expect(409);

    await http()
      .get(`/cursada/${cursada.id}`)
      .set(asUser('externo'))
      .expect(403);
  }, 60000);

  it('archiva y desarchiva una materia conservando su contenido', async () => {
    const materia = (
      await http()
        .post('/materia')
        .set(asUser('admin'))
        .send({ nombre: 'Materia Archivable', codigo: 'ARCH-TEST' })
        .expect(201)
    ).body;

    const cursada = (
      await http()
        .post('/cursada')
        .set(asUser('admin'))
        .send({
          titulo: 'Cursada a conservar',
          descripcion: 'Debe sobrevivir al archivado',
          activa: true,
          fechaInicio: '2026-03-01',
          fechaFin: '2099-07-15',
          materiaId: materia.id,
        })
        .expect(201)
    ).body;

    const enListadoPublico = async () => {
      const body = (await http().get('/materia').expect(200)).body;
      return body.some((item: any) => item.id === materia.id);
    };

    expect(await enListadoPublico()).toBe(true);

    // --- Archivar ---
    const archivada = (
      await http()
        .patch(`/materia/${materia.id}/archivar`)
        .set(asUser('admin'))
        .expect(200)
    ).body;

    expect(archivada.archivada).toBe(true);
    expect(archivada.archivadaEn).toBeTruthy();
    expect(archivada.archivadaPor).toBe(users.admin.email);

    // Deja de estar en circulacion...
    expect(await enListadoPublico()).toBe(false);
    await http()
      .get(`/materia/${materia.id}`)
      .set(asUser('externo'))
      .expect(404);

    // ...pero el admin la sigue viendo, junto con su contenido intacto.
    await http().get(`/materia/${materia.id}`).set(asUser('admin')).expect(200);

    const archivadas = (
      await http().get('/materia/archivadas').set(asUser('admin')).expect(200)
    ).body;
    expect(archivadas.some((item: any) => item.id === materia.id)).toBe(true);

    await http().get('/materia/archivadas').set(asUser('docente')).expect(403);

    const cursadasDeLaMateria = (
      await http()
        .get(`/cursada/materia/${materia.id}`)
        .set(asUser('admin'))
        .expect(200)
    ).body;
    expect(
      cursadasDeLaMateria.some((item: any) => item.id === cursada.id),
    ).toBe(true);

    await http()
      .patch(`/materia/${materia.id}/archivar`)
      .set(asUser('admin'))
      .expect(409);

    // --- Desarchivar ---
    const desarchivada = (
      await http()
        .patch(`/materia/${materia.id}/desarchivar`)
        .set(asUser('admin'))
        .expect(200)
    ).body;

    expect(desarchivada.archivada).toBe(false);
    expect(desarchivada.archivadaEn).toBeNull();
    expect(await enListadoPublico()).toBe(true);

    await http()
      .patch(`/materia/${materia.id}/desarchivar`)
      .set(asUser('admin'))
      .expect(409);
  }, 60000);

  it('permite quitar el enlace de un horario que paso a ser presencial', async () => {
    const materia = (
      await http()
        .post('/materia')
        .set(asUser('admin'))
        .send({ nombre: 'Materia Horarios', codigo: 'HOR-TEST' })
        .expect(201)
    ).body;

    const cursada = (
      await http()
        .post('/cursada')
        .set(asUser('admin'))
        .send({
          titulo: 'Cursada Horarios',
          descripcion: 'Para probar horarios',
          activa: true,
          fechaInicio: '2026-03-01',
          fechaFin: '2099-07-15',
          materiaId: materia.id,
        })
        .expect(201)
    ).body;

    const semana = (
      await http()
        .post('/semana')
        .set(asUser('admin'))
        .send({
          titulo: 'Semana con horario',
          descripcion: 'Intro',
          numeroSemana: 1,
          fechaInicio: '2026-03-02',
          horaInicio: '18:00',
          cursadaId: cursada.id,
        })
        .expect(201)
    ).body;

    const horario = (
      await http()
        .post('/horario')
        .set(asUser('admin'))
        .send({
          titulo: 'Clase',
          tipo: 'virtual',
          detalle: '18:00 a 22:00hs',
          url: 'https://meet.google.com/abc-defg-hij',
          semanaId: semana.id,
        })
        .expect(201)
    ).body;

    expect(horario.url).toBe('https://meet.google.com/abc-defg-hij');

    // La clase pasa a ser presencial y se borra el enlace: null tiene que
    // limpiarlo, no dejar el valor anterior.
    const sinEnlace = (
      await http()
        .put(`/horario/${horario.id}`)
        .set(asUser('admin'))
        .send({
          titulo: 'Clase',
          tipo: 'presencial',
          detalle: '18:00 a 22:00hs - LAB LP-207',
          url: null,
        })
        .expect(200)
    ).body;

    expect(sinEnlace.url).toBeNull();

    const releido = (
      await http()
        .get(`/horario/${horario.id}`)
        .set(asUser('admin'))
        .expect(200)
    ).body;
    expect(releido.url).toBeNull();

    // Un string vacio se trata igual que null.
    await http()
      .put(`/horario/${horario.id}`)
      .set(asUser('admin'))
      .send({ url: 'https://zoom.us/j/123' })
      .expect(200);

    const vaciado = (
      await http()
        .put(`/horario/${horario.id}`)
        .set(asUser('admin'))
        .send({ url: '   ' })
        .expect(200)
    ).body;
    expect(vaciado.url).toBeNull();

    // Omitir el campo no debe borrar un enlace existente.
    await http()
      .put(`/horario/${horario.id}`)
      .set(asUser('admin'))
      .send({ url: 'https://meet.google.com/xyz' })
      .expect(200);

    const intacto = (
      await http()
        .put(`/horario/${horario.id}`)
        .set(asUser('admin'))
        .send({ titulo: 'Clase renombrada' })
        .expect(200)
    ).body;
    expect(intacto.url).toBe('https://meet.google.com/xyz');

    const segundoHorario = (
      await http()
        .post('/horario')
        .set(asUser('admin'))
        .send({
          titulo: 'Consulta',
          tipo: 'virtual',
          detalle: '20:00 a 21:00hs',
          url: 'https://meet.google.com/consulta',
          semanaId: semana.id,
        })
        .expect(201)
    ).body;

    const reordenados = (
      await http()
        .put(`/horario/semana/${semana.id}/orden`)
        .set(asUser('admin'))
        .send({ horarioIds: [segundoHorario.id, horario.id] })
        .expect(200)
    ).body;

    expect(reordenados.map((item: { id: number }) => item.id)).toEqual([
      segundoHorario.id,
      horario.id,
    ]);

    const releidosEnOrden = (
      await http()
        .get(`/horario/semana/${semana.id}`)
        .set(asUser('admin'))
        .expect(200)
    ).body;
    expect(releidosEnOrden.map((item: { id: number }) => item.id)).toEqual([
      segundoHorario.id,
      horario.id,
    ]);
  }, 60000);

  it('permite vaciar los campos opcionales de una cursada y una actividad', async () => {
    const materia = (
      await http()
        .post('/materia')
        .set(asUser('admin'))
        .send({ nombre: 'Materia Opcionales', codigo: 'OPC-TEST' })
        .expect(201)
    ).body;

    const cursada = (
      await http()
        .post('/cursada')
        .set(asUser('admin'))
        .send({
          titulo: 'Cursada Opcionales',
          descripcion: 'Con fechas cargadas',
          activa: false,
          fechaInicio: '2026-03-01',
          fechaFin: '2026-07-15',
          materiaId: materia.id,
        })
        .expect(201)
    ).body;

    expect(cursada.fechaFin).toBe('2026-07-15');

    // Vaciar la fecha de fin.
    const sinFechaFin = (
      await http()
        .put(`/cursada/${cursada.id}`)
        .set(asUser('admin'))
        .send({ fechaFin: null })
        .expect(200)
    ).body;
    expect(sinFechaFin.fechaFin).toBeNull();
    expect(sinFechaFin.fechaInicio).toBe('2026-03-01');

    // Omitir el campo no debe borrar lo que quedaba.
    const intacta = (
      await http()
        .put(`/cursada/${cursada.id}`)
        .set(asUser('admin'))
        .send({ titulo: 'Cursada renombrada' })
        .expect(200)
    ).body;
    expect(intacta.fechaInicio).toBe('2026-03-01');

    // Una descripcion vacia se guarda como null, no como cadena vacia.
    const sinDescripcion = (
      await http()
        .put(`/cursada/${cursada.id}`)
        .set(asUser('admin'))
        .send({ descripcion: '' })
        .expect(200)
    ).body;
    expect(sinDescripcion.descripcion).toBeNull();

    // Borrar la fecha de inicio y poner una fecha de fin anterior a la vieja
    // no debe validarse contra la fecha que se esta quitando.
    const reemplazada = (
      await http()
        .put(`/cursada/${cursada.id}`)
        .set(asUser('admin'))
        .send({ fechaInicio: null, fechaFin: '2026-01-10' })
        .expect(200)
    ).body;
    expect(reemplazada.fechaInicio).toBeNull();
    expect(reemplazada.fechaFin).toBe('2026-01-10');

    // La validacion sigue viva cuando ambas fechas estan presentes.
    await http()
      .put(`/cursada/${cursada.id}`)
      .set(asUser('admin'))
      .send({ fechaInicio: '2026-08-01', fechaFin: '2026-05-01' })
      .expect(400);

    // --- Actividad ---
    const actividad = (
      await http()
        .post('/api/actividad')
        .set(asUser('admin'))
        .send({
          nombre: 'TP Opcionales',
          descripcion: 'Descripcion inicial',
          repositorioBase: 'https://github.com/test/tp-opc',
          tipoCalificacion: 'numerico',
          materiaId: materia.id,
        })
        .expect(201)
    ).body;

    expect(actividad.descripcion).toBe('Descripcion inicial');

    const sinDescripcionActividad = (
      await http()
        .put(`/api/actividad/${actividad.id}`)
        .set(asUser('admin'))
        .send({ descripcion: null })
        .expect(200)
    ).body;
    expect(sinDescripcionActividad.descripcion).toBeNull();

    // Omitir el campo conserva la descripcion.
    await http()
      .put(`/api/actividad/${actividad.id}`)
      .set(asUser('admin'))
      .send({ descripcion: 'Otra vez con texto' })
      .expect(200);

    const conservada = (
      await http()
        .put(`/api/actividad/${actividad.id}`)
        .set(asUser('admin'))
        .send({ nombre: 'TP renombrado' })
        .expect(200)
    ).body;
    expect(conservada.descripcion).toBe('Otra vez con texto');
  }, 60000);

  it('sostiene una conversacion de soporte hasta que el admin la cierra', async () => {
    // Cabecera PNG valida: el backend deduce el tipo del contenido, no del
    // mimetype declarado por el cliente.
    const pngValido = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);

    const reporte = (
      await http()
        .post('/api/soporte')
        .set(asUser('alumno'))
        .field('categoria', 'bug')
        .field('asunto', 'No carga el video de la semana 3')
        .field('mensaje', 'El reproductor queda en negro.')
        .field('paginaOrigen', '/materia/1/semanas/3')
        .expect(201)
    ).body;

    expect(reporte.estado).toBe('abierto');
    expect(reporte.mensajes).toHaveLength(1);
    expect(reporte.mensajes[0].esAdmin).toBe(false);

    // Un solo hilo por usuario.
    await http()
      .post('/api/soporte')
      .set(asUser('alumno'))
      .field('categoria', 'estetico')
      .field('asunto', 'Otro tema')
      .field('mensaje', 'Deberia rebotar')
      .expect(409);

    // La bandeja del admin lo muestra esperando respuesta.
    const bandeja = (
      await http().get('/api/soporte').set(asUser('admin')).expect(200)
    ).body;
    const enBandeja = bandeja.find((item: any) => item.id === reporte.id);
    expect(enBandeja).toBeDefined();
    expect(enBandeja.esperandoRespuesta).toBe(true);
    expect(enBandeja.noLeidos).toBe(1);

    await http().get('/api/soporte').set(asUser('alumno')).expect(403);

    // Ida y vuelta.
    const conRespuesta = (
      await http()
        .post(`/api/soporte/${reporte.id}/mensajes`)
        .set(asUser('admin'))
        .field('mensaje', 'Gracias, lo estamos viendo.')
        .expect(201)
    ).body;
    expect(conRespuesta.mensajes).toHaveLength(2);
    expect(conRespuesta.mensajes[1].esAdmin).toBe(true);

    const vistaUsuario = (
      await http()
        .get('/api/soporte/mi-reporte')
        .set(asUser('alumno'))
        .expect(200)
    ).body;
    expect(vistaUsuario.id).toBe(reporte.id);
    expect(vistaUsuario.noLeidos).toBe(1);

    // El usuario responde adjuntando una captura.
    const conAdjunto = (
      await http()
        .post('/api/soporte/mi-reporte/mensajes')
        .set(asUser('alumno'))
        .field('mensaje', 'Adjunto la captura')
        .attach('imagen', pngValido, {
          filename: 'captura.png',
          contentType: 'image/png',
        })
        .expect(201)
    ).body;

    const adjunto = conAdjunto.mensajes[2].adjuntos[0];
    expect(adjunto).toBeDefined();
    expect(adjunto.mimeType).toBe('image/png');

    await http()
      .get(`/api/soporte/adjunto/${adjunto.id}`)
      .set(asUser('admin'))
      .expect(200)
      .expect('Content-Type', /image\/png/);

    // Un tercero no puede mirar la captura de otro.
    await http()
      .get(`/api/soporte/adjunto/${adjunto.id}`)
      .set(asUser('alumno2'))
      .expect(403);

    // Un archivo que no es imagen se rechaza aunque diga ser PNG.
    await http()
      .post('/api/soporte/mi-reporte/mensajes')
      .set(asUser('alumno'))
      .field('mensaje', 'Esto no es una imagen')
      .attach('imagen', Buffer.from('<script>alert(1)</script>'), {
        filename: 'falso.png',
        contentType: 'image/png',
      })
      .expect(400);

    // --- Cierre ---
    const cerrado = (
      await http()
        .patch(`/api/soporte/${reporte.id}/cerrar`)
        .set(asUser('admin'))
        .expect(200)
    ).body;
    expect(cerrado.estado).toBe('cerrado');

    await http()
      .patch(`/api/soporte/${reporte.id}/cerrar`)
      .set(asUser('admin'))
      .expect(409);

    // El usuario todavia ve el cierre una vez, para no perderse la respuesta.
    const trasCierre = (
      await http()
        .get('/api/soporte/mi-reporte')
        .set(asUser('alumno'))
        .expect(200)
    ).body;
    expect(trasCierre.estado).toBe('cerrado');

    // Ya no puede seguir escribiendo en el hilo cerrado.
    await http()
      .post('/api/soporte/mi-reporte/mensajes')
      .set(asUser('alumno'))
      .field('mensaje', 'Sigo?')
      .expect(404);

    // Cuando confirma que lo vio, el hilo desaparece de su widget.
    await http()
      .patch('/api/soporte/mi-reporte/leido')
      .set(asUser('alumno'))
      .expect(200);

    const sinHilo = await http()
      .get('/api/soporte/mi-reporte')
      .set(asUser('alumno'))
      .expect(200);
    expect(sinHilo.body).toEqual({});

    // Y recien ahi puede abrir uno nuevo.
    await http()
      .post('/api/soporte')
      .set(asUser('alumno'))
      .field('categoria', 'funcionalidad')
      .field('asunto', 'Estaria bueno filtrar por comision')
      .field('mensaje', 'Para no tener que scrollear toda la lista.')
      .expect(201);
  }, 60000);
});
