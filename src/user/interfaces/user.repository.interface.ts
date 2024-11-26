import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export interface IUserRepository {
  createUser(userDto: CreateUserDto): Promise<User>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findAllUsers(): Promise<User[]>;
  updateUser(id: string, userDto: UpdateUserDto): Promise<User | null>;
  deleteUser(id: string): Promise<void>;
}
