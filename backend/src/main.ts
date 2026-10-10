import './config/timezone.config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createAuthJsConfig } from './auth/authjs.config';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import { validateRuntimeEnvironment } from './config/env.validation';
import { simpleRateLimit } from './utils/simple-rate-limit';

import 'reflect-metadata';

async function bootstrap() {
  validateRuntimeEnvironment();
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableShutdownHooks();
  const expressApp = app.getHttpAdapter().getInstance();
  const { ExpressAuth } = await import('@auth/express');

  const configuredProxyHops = Number(process.env.TRUST_PROXY_HOPS || 1);
  expressApp.set(
    'trust proxy',
    Number.isInteger(configuredProxyHops) && configuredProxyHops >= 0
      ? configuredProxyHops
      : 1,
  );
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: [
            "'self'",
            process.env.FRONTEND_ORIGIN || 'http://localhost:3001',
          ],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'sameorigin' },
      hidePoweredBy: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.use((req: any, res: any, next: any) => {
    const correlationId = req.headers['x-correlation-id'] || randomUUID();
    req.correlationId = Array.isArray(correlationId)
      ? correlationId[0]
      : correlationId;
    res.setHeader('x-correlation-id', req.correlationId);
    next();
  });

  expressApp.get('/auth/signin/:provider', (req, res) => {
    const frontendOrigin =
      process.env.FRONTEND_ORIGIN || 'http://localhost:3001';
    res.redirect(`${frontendOrigin}/?login=gitea`);
  });

  // Solo se limita el flujo de login real (signin/callback), que es el que
  // importa frenar ante abuso. /auth/session y /auth/csrf se llaman una vez
  // por cada carga de pantalla de cada usuario -- con una universidad entera
  // saliendo por la misma IP publica (NAT del campus), limitarlos por IP
  // agota el cupo compartido en segundos y deja a todos sin poder validar
  // sesion ("la app no responde"). Ver AUTH_RATE_LIMIT_MAX.
  app.use(
    ['/auth/signin', '/auth/callback'],
    simpleRateLimit({
      windowMs: Number(process.env.AUTH_RATE_LIMIT_TTL_MS || 60000),
      max: Number(process.env.AUTH_RATE_LIMIT_MAX || 300),
      keyPrefix: 'auth',
    }),
  );
  app.use('/auth', ExpressAuth(await createAuthJsConfig()));

  // Aumentar límite de tamaño del body para soportar imágenes/archivos en base64
  const configuredBodyLimit = process.env.JSON_BODY_LIMIT || '10mb';
  const bodyLimit = /^\d+(?:kb|mb)$/i.test(configuredBodyLimit)
    ? configuredBodyLimit
    : '10mb';
  app.use(require('express').json({ limit: bodyLimit }));
  app.use(require('express').urlencoded({ limit: bodyLimit, extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_SWAGGER === 'true'
  ) {
    const config = new DocumentBuilder()
      .setTitle('API de Materias')
      .setDescription(
        'API para la Materiales Tecnologicos - Universidad Nacional de Hurlingham de materias',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      extraModels: [],
      deepScanRoutes: true,
      ignoreGlobalPrefix: false,
    });

    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Aplicacion corriendo en http://localhost:${port}`);

  console.log(`Aplicación corriendo en http://localhost:${port}`);
  console.log(
    `Documentación de la API disponible en http://localhost:${port}/api`,
  );
}

bootstrap();
