import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { hostname } from 'node:os';
import type { NextFunction, Request, Response } from 'express';

const positiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HttpPerformance');
  private readonly slowRequestMs = positiveNumber(
    process.env.SLOW_REQUEST_THRESHOLD_MS,
    1_000,
  );
  private readonly instanceId = process.env.INSTANCE_ID || hostname();
  private readonly appVersion =
    process.env.APP_VERSION || process.env.GIT_COMMIT_SHA || 'unknown';

  use(
    req: Request & { correlationId?: string },
    res: Response,
    next: NextFunction,
  ) {
    const startedAt = process.hrtime.bigint();

    res.setHeader('X-App-Instance', this.instanceId);
    res.setHeader('X-App-Version', this.appVersion);

    res.once('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      if (durationMs < this.slowRequestMs && res.statusCode < 500) return;

      // req.route.path conserva los placeholders (:id) y evita registrar IDs,
      // query strings, cookies, cuerpos o cualquier credencial del usuario.
      const route = req.route?.path
        ? `${req.baseUrl || ''}${req.route.path}`
        : 'unmatched';
      this.logger.warn(
        JSON.stringify({
          event: 'slow_http_request',
          method: req.method,
          route,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs),
          correlationId: req.correlationId || null,
          instance: this.instanceId,
          version: this.appVersion,
        }),
      );
    });

    next();
  }
}
