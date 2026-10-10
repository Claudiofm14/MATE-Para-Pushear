import { createHmac } from 'crypto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GiteaWebhookService } from './gitea-webhook.service';

describe('GiteaWebhookService', () => {
  const service = new GiteaWebhookService();
  const originalEnabled = process.env.GITEA_WEBHOOK_ENABLED;
  const originalSecret = process.env.GITEA_WEBHOOK_SECRET;

  afterEach(() => {
    if (originalEnabled === undefined) delete process.env.GITEA_WEBHOOK_ENABLED;
    else process.env.GITEA_WEBHOOK_ENABLED = originalEnabled;
    if (originalSecret === undefined) delete process.env.GITEA_WEBHOOK_SECRET;
    else process.env.GITEA_WEBHOOK_SECRET = originalSecret;
  });

  it('permanece cerrado cuando el webhook no esta habilitado', () => {
    process.env.GITEA_WEBHOOK_ENABLED = 'false';
    expect(() => service.verifySignature(Buffer.from('{}'), '00')).toThrow(
      NotFoundException,
    );
  });

  it('rechaza secretos de ejemplo', () => {
    process.env.GITEA_WEBHOOK_ENABLED = 'true';
    process.env.GITEA_WEBHOOK_SECRET = 'change-this-secret';
    expect(() => service.verifySignature(Buffer.from('{}'), '00')).toThrow(
      ForbiddenException,
    );
  });

  it('acepta una firma HMAC valida cuando esta habilitado', () => {
    const body = Buffer.from('{"ok":true}');
    const secret = 'a-secure-test-secret';
    process.env.GITEA_WEBHOOK_ENABLED = 'true';
    process.env.GITEA_WEBHOOK_SECRET = secret;
    const signature = createHmac('sha256', secret).update(body).digest('hex');

    expect(() => service.verifySignature(body, signature)).not.toThrow();
  });
});
