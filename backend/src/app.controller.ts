import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from './auth';
import { getArgentinaTimestamp } from './config/timezone.config';
import { hostname } from 'node:os';

const getRuntimeInfo = () => ({
  version: process.env.APP_VERSION || process.env.GIT_COMMIT_SHA || 'unknown',
  instance: process.env.INSTANCE_ID || hostname(),
});

@Controller()
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  @Public()
  async getHealth(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'unavailable',
        timestamp: getArgentinaTimestamp(),
      });
    }

    return {
      status: 'ok',
      database: 'ok',
      timestamp: getArgentinaTimestamp(),
    };
  }

  @Get('status')
  @Public()
  getStatus(): { message: string; version: string; instance: string } {
    return {
      message: 'Proyecto Materias API is running',
      ...getRuntimeInfo(),
    };
  }

  @Get('config/auth-status')
  @Public()
  getAuthConfigStatus() {
    const hasValue = (value?: string) =>
      !!value && !value.startsWith('your-') && !value.startsWith('change-this');
    const giteaConfigured =
      hasValue(process.env.GITEA_BASE_URL) &&
      hasValue(process.env.GITEA_CLIENT_ID) &&
      hasValue(process.env.GITEA_CLIENT_SECRET);
    const giteaBaseUrl = giteaConfigured
      ? process.env.GITEA_BASE_URL!.replace(/\/$/, '')
      : null;

    return {
      gitea: {
        enabled: giteaConfigured,
        logoutUrl: giteaBaseUrl ? `${giteaBaseUrl}/user/logout` : null,
      },
      authSecret: {
        configured: hasValue(process.env.AUTH_SECRET),
      },
    };
  }
}
