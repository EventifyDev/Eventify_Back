import { HttpException, HttpStatus } from '@nestjs/common';

export class EventNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Event with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class EventCreationException extends HttpException {
  constructor(message: string) {
    super(`Failed to create event: ${message}`, HttpStatus.BAD_REQUEST);
  }
}

export class ImageUploadException extends HttpException {
  constructor() {
    super('Failed to upload image', HttpStatus.BAD_REQUEST);
  }
}
