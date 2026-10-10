import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MODULES } from './modules/index.module';
import { ENTITIES } from './entities/index.entity';
import { AuthModule } from './auth';
import { AppController } from './app.controller';
import { getDatabaseConnectionOptions } from './config/database.config';
import { PerformanceMiddleware } from './middleware/performance.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    // UserAwareThrottlerGuard (ver auth/guards) usa el id de usuario como
    // clave cuando hay sesion, asi que este limite ya no se comparte entre
    // todos los alumnos de una misma IP de campus para rutas autenticadas.
    // Para las rutas @Public() (sin usuario) la clave sigue siendo la IP,
    // por eso el default se sube con margen para trafico de campus.
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL_MS || 60000),
        limit: Number(process.env.RATE_LIMIT_MAX || 300),
      },
    ]),
    TypeOrmModule.forRoot({
      ...getDatabaseConnectionOptions(),
      entities: ENTITIES,
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
      retryAttempts: 5,
      retryDelay: 3000,
      autoLoadEntities: true,
    }),
    ...MODULES,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PerformanceMiddleware).forRoutes('*');
  }
}
