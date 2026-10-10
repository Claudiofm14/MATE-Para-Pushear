import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { AlumnoMateria } from '../../entities/alumno-materia.entity';
import { ProfesorMateria } from '../../entities/profesor-materia.entity';
import { ProfesorComision } from '../../entities/profesor-comision.entity';
import { Materia } from '../../entities/materia.entity';
import { Comision } from '../../entities/comision.entity';
import { SolicitudAccesoMateria } from '../../entities/solicitud-acceso-materia.entity';
import { AdminAuditLog } from '../../entities/admin-audit-log.entity';
import { Cursada } from '../../entities/cursada.entity';
import { EntregaActividad } from '../../entities/entrega-actividad.entity';
import { MateriaLog } from '../../entities/materia-log.entity';
import { MaintenanceSetting } from '../../entities/maintenance-setting.entity';
import { UserActivity } from '../../entities/user-activity.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserActivityInterceptor } from './user-activity.interceptor';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { AlumnoMateriaService } from './alumno-materia.service';
import { ProfesorMateriaService } from './profesor-materia.service';
import { StudentImportService } from '../gitea/student-import.service';
import { GiteaUserSyncService } from './gitea-user-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      AlumnoMateria,
      ProfesorMateria,
      ProfesorComision,
      Materia,
      Comision,
      SolicitudAccesoMateria,
      AdminAuditLog,
      Cursada,
      EntregaActividad,
      MateriaLog,
      MaintenanceSetting,
      UserActivity,
    ]),
  ],
  controllers: [UsuarioController],
  providers: [
    UsuarioService,
    AlumnoMateriaService,
    ProfesorMateriaService,
    StudentImportService,
    GiteaUserSyncService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserActivityInterceptor,
    },
  ],
  exports: [UsuarioService, AlumnoMateriaService, ProfesorMateriaService],
})
export class UsuarioModule {}
