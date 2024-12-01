import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export interface IUserService {
  createUser(userDto: CreateUserDto): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, userDto: UpdateUserDto): Promise<User | null>;
  deleteUser(id: string): Promise<void>;
}
