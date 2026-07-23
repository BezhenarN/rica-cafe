import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? '*';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Глобальная валидация DTO: отбрасывает неизвестные поля и выбрасывает 400 при ошибках.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api', { exclude: [] });

  // Swagger-документация: /api/docs
  const config = new DocumentBuilder()
    .setTitle('Crudo API')
    .setDescription('REST API кафе с доставкой готовых блюд и пиццы.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`🚀 Crudo API запущен на http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📚 Swagger:        http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
