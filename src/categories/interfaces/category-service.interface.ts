import { Category } from '../schemas/category.schema';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';

export interface ICategoryService {
  createCategory(createCategoryDto: CreateCategoryDto): Promise<Category>;
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category | null>;
  deleteCategory(id: string): Promise<void>;
}
