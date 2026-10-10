import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CustomRoleGuard } from './guards/custom-role.guard';
import { AuthSessionGuard } from './guards/auth-session.guard';
import { UserAwareThrottlerGuard } from './guards/user-aware-throttler.guard';
import { UsuarioModule } from '../modules/usuario/usuario.module';

@Module({
  imports: [UsuarioModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthSessionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserAwareThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomRoleGuard,
    },
  ],
})
export class AuthModule {}
