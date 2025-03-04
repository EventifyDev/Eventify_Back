import { FilterQuery } from 'mongoose';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export interface IUserRepository {
  createUser(userDto: CreateUserDto): Promise<User>;
  findUser(query: FilterQuery<User>): Promise<User | null>;
  findUserWithPassword(query: FilterQuery<User>): Promise<User | null>;
  addVerifiedDevice(userId: string, deviceFingerprint: string): Promise<void>;
  findAllUsers(): Promise<User[]>;
  updateUser(
    query: FilterQuery<User>,
    data: UpdateUserDto,
  ): Promise<User | null>;
  deleteUser(id: string): Promise<void>;
}
