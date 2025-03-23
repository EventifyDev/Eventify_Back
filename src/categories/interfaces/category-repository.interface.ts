import { Category } from '../schemas/category.schema';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';

export interface ICategoryRepository {
  create(createCategoryDto: CreateCategoryDto): Promise<Category>;
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category | null>;
  delete(id: string): Promise<void>;
}
