import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = exception.errors;
    } else if (exception.name === 'MongoError' && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      message = 'Duplicate key error';
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${
        typeof message === 'object' ? JSON.stringify(message) : message
      }`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
