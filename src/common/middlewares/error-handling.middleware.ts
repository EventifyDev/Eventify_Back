import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MongoError } from 'mongodb';

@Catch()
export class ErrorHandlingMiddleware implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle known errors
    // Handle known errors
    if (error instanceof HttpException) {
      status = error.getStatus();
      const errorResponse = error.getResponse();

      // Better handling of validation errors
      if (typeof errorResponse === 'object') {
        const errorObj = errorResponse as any;
        message = errorObj.message;

        // Handle array of validation messages
        if (Array.isArray(errorObj.message)) {
          message = errorObj.message[0];
        }
        // Handle single message
        else if (typeof errorObj.message === 'string') {
          message = errorObj.message;
        }
      } else {
        message = error.message;
      }
    }
    // Handle MongoDB errors
    else if (error instanceof MongoError) {
      switch (error.code) {
        case 11000:
          status = HttpStatus.CONFLICT;
          message = this.handleDuplicateKeyError(error);
          break;
        default:
          message = 'Database error occurred';
      }
    }

    // Log error for debugging (in production, use a proper logger)
    console.error('Error:', {
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      error: error.message,
      stack: error.stack,
    });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }

  private handleDuplicateKeyError(error: MongoError): string {
    const field = Object.keys(error['keyPattern'])[0];
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }
}
