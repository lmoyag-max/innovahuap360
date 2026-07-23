import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });
  const config = app.get(ConfigService<AppConfig, true>);

  // El stack siempre corre detrás del reverse proxy Nginx (ver nginx/nginx.conf.template):
  // sin esto, el rate limiting y los logs de auditoría registrarían la IP del
  // proxy para todos los usuarios en vez de la IP real del cliente.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: config.get('nodeEnv', { infer: true }) === 'production' ? undefined : false,
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: config.get('corsOrigins', { infer: true }),
    credentials: true,
  });

  app.setGlobalPrefix(config.get('apiPrefix', { infer: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (config.get('swaggerEnabled', { infer: true })) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('InnovaHUAP 360 API')
        .setDescription('API del Comité de Innovación — HUAP Posta Central')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.get('port', { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`InnovaHUAP 360 API escuchando en :${port}`);
}

bootstrap();
