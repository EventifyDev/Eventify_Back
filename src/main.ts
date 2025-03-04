import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config } from 'aws-sdk';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

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

function setupCors(app: any) {
  const allowedOrigins = ['http://localhost:5173'];
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

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          console.log('errors', errors);
          const messages = errors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints || {}).join(', '),
            value: error.value,
          }));
          return new BadRequestException({
            statusCode: 400,
            message: 'Validation failed',
            errors: messages,
          });
        },
      }),
    );

    // Apply the global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    setupSwagger(app);

    // set the aws sdk used to upload files and images to aws s3 bucket
    config.update({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION,
    });

    app.setGlobalPrefix('api/v1');

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
    logger.log(
      `📚 Swagger documentation available at: ${await app.getUrl()}/api-docs`,
    );
  } catch (error) {
    logger.error(`❌ Application failed to start: ${error}`);
    process.exit(1);
  }
}

bootstrap();
