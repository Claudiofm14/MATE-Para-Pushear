// API Client
export { apiClient } from './api.client';

// Services
export { semanaService } from './semana.service';
export { videoService } from './video.service';
export { cursadaService } from './cursada.service';
export { comisionService } from './comision.service';
export { ejercicioService } from './ejercicio.service';
export { horarioService } from './horario.service';
export { contratoPedagogicoService } from './contrato-pedagogico.service';
export { materialAcademicoService } from './material-academico.service';
export { materiaConfigService } from './materia-config.service';
export type {
  MateriaConfig,
  MateriaLog,
  MateriaTabKey,
  PageHeaderConfig,
} from './materia-config.service';

// Types - Semana
export type {
  Semana,
  CreateSemanaDto,
  UpdateSemanaDto,
} from './semana.service';

// Types - Video
export type { Video, CreateVideoDto, UpdateVideoDto } from './video.service';

// Types - Cursada
export type {
  Cursada,
  CreateCursadaDto,
  UpdateCursadaDto,
  GiteaOrganization,
} from './cursada.service';

// Types - Comision
export type {
  Comision,
  CreateComisionDto,
  UpdateComisionDto,
} from './comision.service';

// Types - Ejercicio
export type {
  Ejercicio,
  CreateEjercicioDto,
  UpdateEjercicioDto,
  GiteaTemplateRepo,
  StudentExerciseRepository,
  TeacherExerciseRepository,
  MyExerciseRepository,
  TipoActividadEjercicio,
  TipoRecursoEjercicio,
} from './ejercicio.service';

// Types - Horario
export { TipoHorario } from './horario.service';
export type {
  Horario,
  CreateHorarioDto,
  UpdateHorarioDto,
} from './horario.service';

// Types - Contrato Pedagógico
export type {
  ContratoPedagogico,
  ContenedorContrato,
  CreateContratoPedagogicoDto,
  UpdateContratoPedagogicoDto,
  CreateContenedorDto,
} from './contrato-pedagogico.service';

// Types - Material Académico
export type {
  MaterialAcademico,
  CreateMaterialAcademicoDto,
  UpdateMaterialAcademicoDto,
} from './material-academico.service';
