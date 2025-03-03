import { ICategoryService } from '../interfaces/category-service.interface';
import { Injectable, Logger } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { Category } from '../schemas/category.schema';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import {
  CategoryNotFoundException,
  CategoryCreationException,
} from '../exeptions/category.exeption';

@Injectable()
export class CategoryService implements ICategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly categoryRepository: CategoryRepository) {}

  /**
   * Creates a new category
   * @param createCategoryDto The category data to create
   * @throws {CategoryCreationException} When category creation fails
   */
  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    try {
      const category = await this.categoryRepository.create(createCategoryDto);
      this.logOperation('created', category.name);
      return category;
    } catch (error) {
      throw new CategoryCreationException(error.message);
    }
  }

  /**
   * Retrieves all categories
   * @throws {Error} When fetching categories fails
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.findAll();
      this.logOperation('retrieved', `${categories.length} categories`);
      return categories;
    } catch (error) {
      this.handleError('retrieving all categories', error);
    }
  }

  /**
   * Retrieves a category by its ID
   * @param id The category ID to find
   * @throws {CategoryNotFoundException} When category is not found
   */
  async getCategoryById(id: string): Promise<Category> {
    try {
      const category = await this.categoryRepository.findById(id);

      if (!category) {
        throw new CategoryNotFoundException(id);
      }

      this.logOperation('retrieved', `category ${id}`);
      return category;
    } catch (error) {
      if (error instanceof CategoryNotFoundException) {
        throw error;
      }
      this.handleError(`retrieving category ${id}`, error);
    }
  }

  /**
   * Updates an existing category
   * @param id The category ID to update
   * @param updateCategoryDto The update data
   * @throws {CategoryNotFoundException} When category is not found
   */
  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    try {
      const category = await this.categoryRepository.update(
        id,
        updateCategoryDto,
      );

      if (!category) {
        throw new CategoryNotFoundException(id);
      }

      this.logOperation('updated', `category ${id}`);
      return category;
    } catch (error) {
      if (error instanceof CategoryNotFoundException) {
        throw error;
      }
      this.handleError(`updating category ${id}`, error);
    }
  }

  /**
   * Deletes a category
   * @param id The category ID to delete
   * @throws {CategoryNotFoundException} When category is not found
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      await this.categoryRepository.delete(id);

      this.logOperation('deleted', `category ${id}`);
    } catch (error) {
      if (error instanceof CategoryNotFoundException) {
        throw error;
      }
      this.handleError(`deleting category ${id}`, error);
    }
  }

  /**
   * Handles and logs errors
   * @private
   */
  private handleError(operation: string, error: Error): never {
    this.logger.error(`Error while ${operation}`, {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }

  /**
   * Logs successful operations
   * @private
   */
  private logOperation(operation: string, details: string): void {
    this.logger.debug(`Successfully ${operation} ${details}`);
  }
}
