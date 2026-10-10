import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UsuarioService } from '../../modules/usuario/usuario.service';
import { createAuthJsConfig } from '../authjs.config';

@Injectable()
export class AuthSessionGuard implements CanActivate {
  private readonly authConfig = createAuthJsConfig();

  constructor(
    private readonly reflector: Reflector,
    private readonly usuarioService: UsuarioService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { getSession } = await import('@auth/express');
    const session = await getSession(request, await this.authConfig);

    if (!session?.user) {
      throw new UnauthorizedException('No autenticado');
    }

    if ((session.user as any).provider !== 'gitea') {
      throw new UnauthorizedException(
        'Sesión inválida: vuelva a iniciar sesión con Gitea',
      );
    }

    const usuario = await this.usuarioService.obtenerOCrearUsuarioDesdeAuthJs(
      session.user,
    );

    if (usuario.activo === false) {
      throw new ForbiddenException(
        'Tu usuario esta suspendido. Contacta a un administrador.',
      );
    }

    const maintenance = await this.usuarioService.obtenerMaintenanceStatus();
    const isSessionBootstrapRoute = request.path === '/api/usuario/me';
    if (
      maintenance.enabled &&
      usuario.rol !== 'admin' &&
      !isSessionBootstrapRoute
    ) {
      throw new ServiceUnavailableException({
        message: maintenance.message,
        title: maintenance.title,
        maintenance: true,
        estimatedUntil: maintenance.estimatedUntil,
      });
    }

    request.authSession = session;
    request.usuario = usuario;
    request.user = {
      // Los controladores reutilizan el usuario ya resuelto por este guard.
      // Evita repetir la misma consulta a PostgreSQL en cada request.
      localUsuario: usuario,
      sub: usuario.authProviderId,
      email: usuario.email,
      name: `${usuario.nombre} ${usuario.apellido}`.trim(),
      preferred_username: usuario.githubUser,
      realm_access: {
        roles: [usuario.rol],
      },
    };

    return true;
  }
}
