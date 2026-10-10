import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { Public } from '../../auth';
import { GiteaWebhookService } from './gitea-webhook.service';

@Controller('api/webhooks/gitea')
export class GiteaWebhookController {
  constructor(private readonly webhookService: GiteaWebhookService) {}

  @Post()
  @Public()
  async handleWebhook(
    @Req() req: any,
    @Headers('x-gitea-event') event: string,
    @Headers('x-gitea-signature') signature: string,
    @Body() payload: any,
  ) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(payload || {}));
    this.webhookService.verifySignature(rawBody, signature);
    await this.webhookService.processEvent(event, payload);
    return { ok: true };
  }
}
