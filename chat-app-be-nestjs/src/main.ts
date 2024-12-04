import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "./config/config";
import * as process from "node:process";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: (process.env.COORS_METHODS || "GET,POST").split(',').map(e => e.trim().toUpperCase())
    }
  });

  app.enableVersioning({
    type: VersioningType.URI, // /v<?>
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const cs = app.get(ConfigService)
  const appConfig = cs.get<AppConfig>('app')
  Logger.log(`server is listening on port ${appConfig.port}`)
  await app.listen(appConfig.port);
}
bootstrap();
