import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors: true});

  await app.listen(9000, () => {
    Logger.log("the service is starting in http://127.0.0.1:8080")
  })

}
bootstrap();
