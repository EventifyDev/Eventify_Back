import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function setupSwagger(app: any) {
  const options = new DocumentBuilder()
    .setTitle('Eventify API')
    .setDescription(
      `
      The Eventify API is a robust and scalable backend service designed to facilitate 
      the management of sports events. It provides a comprehensive set of endpoints 
      for event organizers to create, manage, and interact with various event-related features. 
      Built with NestJS, the API ensures security, performance, and ease of integration 
      with modern front-end applications.
    `,
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000/', 'Local environment')
    .addTag('Eventify API')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
}

function setupGlobalPipes(app: any) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
}

function setupCors(app: any) {
  const allowedOrigins = ['http://localhost:3000'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    setupCors(app);
    setupGlobalPipes(app);
    setupSwagger(app);

    app.setGlobalPrefix('api/v1');

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
    logger.log(
      `📚 Swagger documentation available at: ${await app.getUrl()}/api-docs`,
    );
  } catch (error) {
    logger.error('❌ Application failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
