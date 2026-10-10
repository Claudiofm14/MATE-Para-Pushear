import { ForbiddenException } from '@nestjs/common';
import { VideoController } from '../modules/video/video.controller';
import { MateriaController } from '../modules/materia/materia.controller';
import {
  adminRequest,
  alumnoRequest,
  docenteRequest,
  testAcademicGraph,
  testUsers,
} from './helpers/security-fixtures';

function userServiceMock() {
  return {
    obtenerOCrearUsuario: jest.fn(async (authUser) => {
      const user = Object.values(testUsers).find(
        (item) => item.email === authUser.email,
      );
      if (!user) throw new Error(`Unknown test user ${authUser.email}`);
      return user;
    }),
  };
}

describe('IDOR and ownership checks in high-risk controllers', () => {
  describe('VideoController', () => {
    function buildController(options?: {
      professorAccess?: boolean;
      studentCourseAccess?: boolean;
      visibleWeeks?: number[];
    }) {
      const videoService = {
        findOne: jest.fn(async (id: number) => ({
          id,
          titulo: `Video ${id}`,
          semana: testAcademicGraph.semanaA1,
        })),
        findBySemana: jest.fn(async () => [{ id: 1 }]),
        findByMateria: jest.fn(async () => [{ id: 1 }]),
        getPlaylistVideos: jest.fn(async () => ({
          playlistId: 'PL-test',
          videos: [{ titulo: 'Video de la playlist' }],
        })),
      };
      const usuarioService = userServiceMock();
      const profesorMateriaService = {
        verificarAccesoProfesor: jest.fn(
          async () => options?.professorAccess ?? false,
        ),
      };
      const alumnoMateriaService = {
        verificarAccesoAlumno: jest.fn(
          async () => options?.studentCourseAccess ?? false,
        ),
        verificarAccesoAlumnoCursada: jest.fn(
          async () => options?.studentCourseAccess ?? false,
        ),
      };
      const semanaService = {
        findOne: jest.fn(async () => testAcademicGraph.semanaA1),
        findVisiblesParaAlumno: jest.fn(async () =>
          (options?.visibleWeeks ?? []).map((id) => ({ id })),
        ),
      };
      const materiaLogService = { create: jest.fn() };

      return {
        controller: new VideoController(
          videoService as any,
          usuarioService as any,
          profesorMateriaService as any,
          alumnoMateriaService as any,
          semanaService as any,
          materiaLogService as any,
        ),
        videoService,
        profesorMateriaService,
        alumnoMateriaService,
      };
    }

    it('allows an admin to read any video without ownership checks', async () => {
      const { controller, profesorMateriaService, alumnoMateriaService } =
        buildController();

      await expect(controller.findOne(adminRequest(), 1)).resolves.toEqual(
        expect.objectContaining({ id: 1 }),
      );
      expect(
        profesorMateriaService.verificarAccesoProfesor,
      ).not.toHaveBeenCalled();
      expect(
        alumnoMateriaService.verificarAccesoAlumnoCursada,
      ).not.toHaveBeenCalled();
    });

    it('allows a docente only when assigned to the materia', async () => {
      const { controller } = buildController({ professorAccess: true });

      await expect(
        controller.findBySemana(docenteRequest(), 10000),
      ).resolves.toEqual([{ id: 1 }]);
    });

    it('rejects a docente attempting to read another docente course', async () => {
      const { controller } = buildController({ professorAccess: false });

      await expect(
        controller.findBySemana(docenteRequest(), 20000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an alumno only for assigned and visible weeks', async () => {
      const { controller } = buildController({
        studentCourseAccess: true,
        visibleWeeks: [testAcademicGraph.semanaA1.id],
      });

      await expect(controller.findOne(alumnoRequest(), 1)).resolves.toEqual(
        expect.objectContaining({ id: 1 }),
      );
    });

    it('allows playlist videos only for assigned and visible weeks', async () => {
      const { controller, videoService } = buildController({
        studentCourseAccess: true,
        visibleWeeks: [testAcademicGraph.semanaA1.id],
      });
      await expect(
        controller.getPlaylistVideos(alumnoRequest(), 1),
      ).resolves.toMatchObject({
        playlistId: 'PL-test',
      });
      expect(videoService.getPlaylistVideos).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
      );
    });

    it('rejects playlist queries for a week hidden from the alumno', async () => {
      const { controller, videoService } = buildController({
        studentCourseAccess: true,
        visibleWeeks: [],
      });
      await expect(
        controller.getPlaylistVideos(alumnoRequest(), 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(videoService.getPlaylistVideos).not.toHaveBeenCalled();
    });

    it('rejects playlist queries from a docente without access to the materia', async () => {
      const { controller, videoService } = buildController({
        professorAccess: false,
      });
      await expect(
        controller.getPlaylistVideos(docenteRequest(), 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(videoService.getPlaylistVideos).not.toHaveBeenCalled();
    });

    it('rejects an alumno changing semana id to an assigned but not visible week', async () => {
      const { controller } = buildController({
        studentCourseAccess: true,
        visibleWeeks: [],
      });

      await expect(
        controller.findBySemana(alumnoRequest(), 10000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an alumno changing materia id to a non-assigned materia', async () => {
      const { controller } = buildController({ studentCourseAccess: false });

      await expect(
        controller.findByMateria(alumnoRequest(), 20),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('MateriaController', () => {
    function buildController(options?: {
      professorAccess?: boolean;
      studentAccess?: boolean;
    }) {
      const materiaService = {
        getConfiguracion: jest.fn(async () => ({ tabs: { logs: true } })),
        findPublicAll: jest.fn(),
        findPublicOne: jest.fn(),
        findPublicByCodigo: jest.fn(),
      };
      const usuarioService = userServiceMock();
      const profesorMateriaService = {
        verificarAccesoProfesor: jest.fn(
          async () => options?.professorAccess ?? false,
        ),
      };
      const alumnoMateriaService = {
        verificarAccesoAlumno: jest.fn(
          async () => options?.studentAccess ?? false,
        ),
      };
      const materiaLogService = { create: jest.fn() };

      return new MateriaController(
        materiaService as any,
        usuarioService as any,
        profesorMateriaService as any,
        alumnoMateriaService as any,
        materiaLogService as any,
      );
    }

    it('rejects configuration reads for alumnos outside the materia', async () => {
      const controller = buildController({ studentAccess: false });

      await expect(
        controller.getConfiguracion(alumnoRequest(), 20),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows configuration reads for assigned docentes', async () => {
      const controller = buildController({ professorAccess: true });

      await expect(
        controller.getConfiguracion(docenteRequest(), 10),
      ).resolves.toEqual({
        tabs: { logs: true },
      });
    });
  });
});
