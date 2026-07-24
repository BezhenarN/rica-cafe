import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';
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

  // Статические файлы — загрузки фото товаров: /uploads/<файл>
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  // Swagger-документация: /api/docs
  const config = new DocumentBuilder()
    .setTitle('Рица API')
    .setDescription('REST API кафе «Рица» — Сочи. Каталог, доставка, самовывоз.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`🚀 Рица API запущен на http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📚 Swagger:        http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
