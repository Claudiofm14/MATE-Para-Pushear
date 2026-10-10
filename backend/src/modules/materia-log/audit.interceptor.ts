import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { MateriaLogAction } from '../../entities/materia-log.entity';
import { MateriaLogService } from './materia-log.service';

const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const sensitiveKeys = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'authorization',
  'csrfToken',
]);

function redact(value: unknown, depth = 0): unknown {
  if (depth >= 6) return '[TRUNCATED_DEPTH]';
  if (typeof value === 'string') {
    return value.length > 2_000
      ? `${value.slice(0, 2_000)}...[TRUNCATED]`
      : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redact(item, depth + 1));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 50)
        .map(([key, item]) => [
          key,
          sensitiveKeys.has(key) ? '[REDACTED]' : redact(item, depth + 1),
        ]),
    );
  }
  return value;
}

function actionFromMethod(method: string): MateriaLogAction {
  if (method === 'POST') return MateriaLogAction.CREATED;
  if (method === 'DELETE') return MateriaLogAction.DELETED;
  return MateriaLogAction.UPDATED;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly materiaLogService: MateriaLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (
      !writeMethods.has(request.method) ||
      request.path?.startsWith('/auth')
    ) {
      return next.handle();
    }

    const startedAt = Date.now();
    const materiaId = Number(
      request.params?.materiaId ||
        request.body?.materiaId ||
        (request.path?.startsWith('/materia/')
          ? request.params?.id
          : undefined),
    );
    const usuario = request.usuario;

    const writeLog = async (result: string, error?: unknown) => {
      if (!Number.isInteger(materiaId)) return;

      await this.materiaLogService.create({
        materiaId,
        usuarioId: usuario?.id,
        actorNombre: usuario
          ? `${usuario.nombre} ${usuario.apellido}`.trim()
          : undefined,
        actorEmail: usuario?.email,
        action: actionFromMethod(request.method),
        resourceType: request.route?.path || request.path,
        resourceId: String(request.params?.id || request.body?.id || materiaId),
        title: `${request.method} ${request.path}`,
        detail: `Operacion ${result} en ${Date.now() - startedAt}ms`,
        result,
        error:
          error instanceof Error
            ? error.message
            : error
              ? String(error)
              : undefined,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        correlationId: request.correlationId,
        newValues: redact(request.body) as Record<string, any>,
      });
    };

    return next.handle().pipe(
      tap(() => {
        void writeLog(response.statusCode < 400 ? 'success' : 'failed').catch(
          (error) =>
            this.logger.error(
              `No se pudo persistir auditoria ${request.correlationId || ''}: ${error instanceof Error ? error.message : String(error)}`,
            ),
        );
      }),
      catchError((error) => {
        void writeLog('failed', error).catch((auditError) =>
          this.logger.error(
            `No se pudo persistir auditoria fallida ${request.correlationId || ''}: ${auditError instanceof Error ? auditError.message : String(auditError)}`,
          ),
        );
        return throwError(() => error);
      }),
    );
  }
}
