import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class GiteaWebhookService {
  private readonly logger = new Logger(GiteaWebhookService.name);

  verifySignature(rawBody: Buffer, signature?: string) {
    if (process.env.GITEA_WEBHOOK_ENABLED !== 'true') {
      throw new NotFoundException();
    }

    const secret = process.env.GITEA_WEBHOOK_SECRET;
    if (!secret || secret.startsWith('change-this')) {
      throw new ForbiddenException('Gitea webhook secret is not configured');
    }

    if (!signature) {
      throw new ForbiddenException('Missing Gitea webhook signature');
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      throw new ForbiddenException('Invalid Gitea webhook signature');
    }
  }

  async processEvent(event: string, payload: any) {
    switch (event) {
      case 'push':
      case 'pull_request':
      case 'repository':
        this.logger.log(
          `Gitea webhook received: ${event} for ${payload?.repository?.full_name || 'unknown repository'}`,
        );
        break;
      default:
        this.logger.log(`Gitea webhook ignored: ${event || 'unknown event'}`);
    }
  }
}
