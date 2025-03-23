import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private lastErrorMessage: string = '';
  private errorCount: number = 0;
  private lastErrorTime: number = 0;

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
    } else if (exception.name === 'JsonWebTokenError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Invalid token';
    } else if (exception.name === 'TokenExpiredError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Token expired';
    }

    // Convert message to string for comparison
    const messageStr =
      typeof message === 'object' ? JSON.stringify(message) : String(message);
    const currentTime = Date.now();

    // Rate limit logging for repeated identical errors
    if (
      messageStr === this.lastErrorMessage &&
      request.url === '/api/v1/auth/refresh' &&
      exception instanceof UnauthorizedException
    ) {
      this.errorCount++;

      // Only log every 20 occurrences or if more than 10 seconds have passed
      if (
        this.errorCount % 20 === 0 ||
        currentTime - this.lastErrorTime > 10000
      ) {
        this.logger.error(
          `${request.method} ${request.url} - ${status} - ${messageStr} (repeated ${this.errorCount} times)`,
          exception.stack,
        );
        this.lastErrorTime = currentTime;
      }
    } else {
      // New error, log it normally
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${messageStr}`,
        exception.stack,
      );

      this.lastErrorMessage = messageStr;
      this.errorCount = 1;
      this.lastErrorTime = currentTime;
    }

    // For refresh token issues, add additional guidance in the response
    const responseBody: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    if (
      request.url === '/api/v1/auth/refresh' &&
      status === HttpStatus.UNAUTHORIZED
    ) {
      responseBody.hint =
        'Ensure the refresh token is included in the request body, cookies, or as a Bearer token in the Authorization header';
    }

    response.status(status).json(responseBody);
  }
}
