import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.getOrThrow<string>('FRONTEND_URL');

  app.use(cookieParser());
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle('FinTrack API')
    .setDescription(
      'Authenticated account, transaction, and dashboard API. Financial amounts use integer minor units and all reporting remains separated by currency.',
    )
    .setVersion('1.0.0')
    .addCookieAuth('fintrack_session', {
      type: 'apiKey',
      in: 'cookie',
      name: 'fintrack_session',
    })
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('docs', app, openApiDocument);

  const port = configService.getOrThrow<number>('PORT');
  await app.listen(port);
  console.log(`FinTrack API listening on port ${port}`);
}

void bootstrap();