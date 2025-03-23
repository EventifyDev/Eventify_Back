import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { FilterQuery } from 'mongoose';

export interface IUserService {
  createUser(userDto: CreateUserDto): Promise<User>;
  getUser(query: FilterQuery<User>): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  updateUser(
    query: FilterQuery<User>,
    data: UpdateUserDto,
  ): Promise<User | null>;
  deleteUser(id: string): Promise<void>;
}
