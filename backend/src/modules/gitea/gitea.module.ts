import { Module } from '@nestjs/common';
import { GiteaWebhookController } from './gitea-webhook.controller';
import { GiteaWebhookService } from './gitea-webhook.service';
import { StudentImportController } from './student-import.controller';
import { StudentImportService } from './student-import.service';
import { GiteaIntegrationController } from './gitea-integration.controller';
import { CursadaModule } from '../cursada/cursada.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [CursadaModule, UsuarioModule],
  controllers: [
    GiteaWebhookController,
    StudentImportController,
    GiteaIntegrationController,
  ],
  providers: [GiteaWebhookService, StudentImportService],
  exports: [GiteaWebhookService, StudentImportService],
})
export class GiteaModule {}
