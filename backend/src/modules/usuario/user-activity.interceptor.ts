import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, tap } from 'rxjs';
import { Repository } from 'typeorm';
import { UserActivity } from '../../entities/user-activity.entity';

@Injectable()
export class UserActivityInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method || '').toUpperCase();
    const userId = request.usuario?.id;
    const rawPath = String(request.path || '');
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const excluded =
      rawPath.endsWith('/actividad/presencia') ||
      rawPath.startsWith('/auth/') ||
      rawPath.includes('/admin/estadisticas-actividad');

    if (!userId || !isMutation || excluded) return next.handle();

    return next.handle().pipe(
      tap(() => {
        const section = this.resolveSection(rawPath);
        const verb =
          method === 'DELETE'
            ? 'Eliminó contenido'
            : method === 'POST'
              ? 'Creó o envió contenido'
              : 'Actualizó contenido';
        void this.activityRepository
          .save(
            this.activityRepository.create({
              userId,
              kind: 'action',
              path: section.path,
              label: `${verb} en ${section.label}`,
            }),
          )
          // La telemetría nunca debe provocar que falle una operación académica.
          .catch(() => undefined);
      }),
    );
  }

  private resolveSection(rawPath: string): { path: string; label: string } {
    const definitions: Array<[RegExp, string, string]> = [
      [/actividad|entrega/i, '/acciones/actividades', 'actividades y entregas'],
      [/ejercicio|repositor/i, '/acciones/ejercicios', 'ejercicios'],
      [/material/i, '/acciones/material', 'materiales'],
      [/video/i, '/acciones/videos', 'videos'],
      [/semana/i, '/acciones/semanas', 'semanas'],
      [/cronograma/i, '/acciones/cronograma', 'cronograma'],
      [/usuario|alumno|profesor|solicitud/i, '/acciones/usuarios', 'usuarios'],
      [/materia|cursada|comision/i, '/acciones/materias', 'materias'],
    ];
    const match = definitions.find(([pattern]) => pattern.test(rawPath));
    return match
      ? { path: match[1], label: match[2] }
      : { path: '/acciones/otras', label: 'otra sección' };
  }
}
