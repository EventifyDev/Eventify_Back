import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: ['http://localhost:3000'],
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('Application failed to start:', error);
    process.exit(1);
  }
}
bootstrap();
