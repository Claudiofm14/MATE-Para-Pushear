import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MateriaLog } from '../../entities/materia-log.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { MateriaLogController } from './materia-log.controller';
import { MateriaLogService } from './materia-log.service';
import { AuditInterceptor } from './audit.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([MateriaLog]), UsuarioModule],
  controllers: [MateriaLogController],
  providers: [
    MateriaLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [MateriaLogService],
})
export class MateriaLogModule {}
