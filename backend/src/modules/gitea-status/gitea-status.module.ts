import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentExerciseRepository } from '../../entities/index.entity';
import { UsuarioModule } from '../usuario/usuario.module';
import { GiteaStatusController } from './gitea-status.controller';
import { GiteaStatusService } from './gitea-status.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentExerciseRepository]),
    UsuarioModule,
  ],
  controllers: [GiteaStatusController],
  providers: [GiteaStatusService],
})
export class GiteaStatusModule {}
