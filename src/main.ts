import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config } from 'aws-sdk';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';

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
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Cookie',
      'Set-Cookie',
    ],
  });
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());

    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true,
        cookie: {
          maxAge: 3600000,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          httpOnly: true,
        },
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

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
    // app.useGlobalFilters(new GlobalExceptionFilter());

    setupSwagger(app);

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
