import { NotFoundException, BadRequestException } from '@nestjs/common';

export class CategoryNotFoundException extends NotFoundException {
  constructor(categoryId: string) {
    super(`Category with ID ${categoryId} not found`);
  }
}

export class CategoryCreationException extends BadRequestException {
  constructor(message: string) {
    super(`Category creation failed: ${message}`);
  }
}
