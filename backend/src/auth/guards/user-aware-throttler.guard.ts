import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: Record<string, any>): Promise<string> {
    const userId = request.user?.localUsuario?.id || request.user?.sub;

    // Los usuarios de una universidad suelen compartir una misma IP pública.
    // Una clave por usuario evita que 500 alumnos agoten juntos el cupo de IP.
    // Las rutas públicas continúan limitándose por dirección IP.
    return userId ? `user:${String(userId)}` : `ip:${request.ip}`;
  }
}
