import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Listening on 8080 as requested
  await app.listen(8080);
  console.log('BMS API is running on: http://localhost:8080');
}
bootstrap();
