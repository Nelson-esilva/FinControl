import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Uploads locais apenas em dev (sem Cloudinary)
  const useCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  if (!useCloudinary) {
    const uploadsDir = join(process.cwd(), 'uploads');
    const avatarsDir = join(uploadsDir, 'avatars');
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
    if (!existsSync(avatarsDir)) mkdirSync(avatarsDir, { recursive: true });
    app.use('/uploads', express.static(uploadsDir));
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
    : true;
  app.enableCors({ origin: allowedOrigins, credentials: true });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();

