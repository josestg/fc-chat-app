import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "./config/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
