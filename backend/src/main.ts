import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Em produção (imagem Docker), o build do frontend é copiado para
  // backend/public no mesmo container — servido pelo próprio Nest para que
  // o apiClient do frontend (baseURL relativa "/api") funcione sem CORS e
  // sem precisar de um segundo serviço. Em dev, essa pasta não existe e o
  // bloco é ignorado (o frontend roda via Vite na porta 5173).
  const publicDir = join(__dirname, '..', 'public');
  if (existsSync(join(publicDir, 'index.html'))) {
    app.useStaticAssets(publicDir);
    app.getHttpAdapter()
      .getInstance()
      .get('*', (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api')) {
          next();
          return;
        }
        res.sendFile(join(publicDir, 'index.html'));
      });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API rodando em http://localhost:${port}/api`);
}

bootstrap();
