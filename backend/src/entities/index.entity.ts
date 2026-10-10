import { Inicio } from './inicio.entity';
import { Contenedor } from './contenedor.entity';
import { ContratoPedagogico } from './contrato_pedagogico.entity';
import { Material } from './material.entity';
import { Materia } from './materia.entity';
import { InicioContenedor } from './inicio-contenedor.entity';
import { MaterialContenedor } from './material-contenedor.entity';
import { ContratoPedagogicoContenedor } from './contrato-pedagogico-contenedor.entity';
import { Cursada } from './cursada.entity';
import { Comision } from './comision.entity';
import { Semana } from './semana.entity';
import { Video } from './video.entity';
import { Ejercicio } from './ejercicio.entity';
import { Horario } from './horario.entity';
import { MaterialAcademico } from './material-academico.entity';
import { Usuario } from './usuario.entity';
import { AlumnoMateria } from './alumno-materia.entity';
import { ProfesorMateria } from './profesor-materia.entity';
import { ProfesorComision } from './profesor-comision.entity';
import { SolicitudAccesoMateria } from './solicitud-acceso-materia.entity';
import { Actividad } from './actividad.entity';
import { EntregaActividad } from './entrega-actividad.entity';
import { MateriaLog } from './materia-log.entity';
import { StudentExerciseRepository } from './student-exercise-repository.entity';
import { AdminAuditLog } from './admin-audit-log.entity';
import { MaintenanceSetting } from './maintenance-setting.entity';
import { ExerciseGroup } from './exercise-group.entity';
import { ExerciseGroupMember } from './exercise-group-member.entity';
import { GroupExerciseRepository } from './group-exercise-repository.entity';
import { TeacherExerciseRepository } from './teacher-exercise-repository.entity';
import { CronogramaFila } from './cronograma-fila.entity';
import { CronogramaFilaComision } from './cronograma-fila-comision.entity';
import { UserActivity } from './user-activity.entity';
import { ReporteSoporte } from './reporte-soporte.entity';
import { MensajeSoporte } from './mensaje-soporte.entity';
import { AdjuntoSoporte } from './adjunto-soporte.entity';

export const ENTITIES = [
  Materia,
  Inicio,
  Contenedor,
  ContratoPedagogico,
  Material,
  InicioContenedor,
  MaterialContenedor,
  ContratoPedagogicoContenedor,
  Cursada,
  Comision,
  Semana,
  Video,
  Ejercicio,
  Horario,
  MaterialAcademico,
  Usuario,
  AlumnoMateria,
  ProfesorMateria,
  ProfesorComision,
  SolicitudAccesoMateria,
  Actividad,
  EntregaActividad,
  MateriaLog,
  StudentExerciseRepository,
  AdminAuditLog,
  MaintenanceSetting,
  ExerciseGroup,
  ExerciseGroupMember,
  GroupExerciseRepository,
  TeacherExerciseRepository,
  CronogramaFila,
  CronogramaFilaComision,
  UserActivity,
  ReporteSoporte,
  MensajeSoporte,
  AdjuntoSoporte,
];

export {
  Materia,
  Inicio,
  Contenedor,
  ContratoPedagogico,
  Material,
  InicioContenedor,
  MaterialContenedor,
  ContratoPedagogicoContenedor,
  Cursada,
  Comision,
  Semana,
  Video,
  Ejercicio,
  Horario,
  MaterialAcademico,
  Usuario,
  AlumnoMateria,
  ProfesorMateria,
  ProfesorComision,
  SolicitudAccesoMateria,
  Actividad,
  EntregaActividad,
  MateriaLog,
  StudentExerciseRepository,
  AdminAuditLog,
  MaintenanceSetting,
  ExerciseGroup,
  ExerciseGroupMember,
  GroupExerciseRepository,
  TeacherExerciseRepository,
  CronogramaFila,
  CronogramaFilaComision,
  UserActivity,
  ReporteSoporte,
  MensajeSoporte,
  AdjuntoSoporte,
};
