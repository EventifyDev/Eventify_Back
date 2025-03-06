import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { IUserService } from '../interfaces/user.interface';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { FilterQuery } from 'mongoose';

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
  ) {}

  async createUser(userDto: CreateUserDto): Promise<User> {
    const existingEmail = await this.userRepository.findUser({
      email: userDto.email.toLowerCase(),
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUsername = await this.userRepository.findUser({
      username: userDto.username.toLowerCase(),
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(userDto.password, 10);

    const userWithHashedPassword = {
      ...userDto,
      email: userDto.email.toLowerCase(),
      username: userDto.username.toLowerCase(),
      password: hashedPassword,
    };
    return this.userRepository.createUser(userWithHashedPassword);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAllUsers();
  }

  async getUser(query: FilterQuery<User>): Promise<User | null> {
    const user = await this.userRepository.findUser(query);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findUser({ email: email.toLowerCase() });
  }

  async findUserByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findUserWithPassword({
      email: email.toLowerCase(),
    });
  }

  async addVerifiedDevice(
    userId: string,
    deviceFingerprint: string,
  ): Promise<void> {
    await this.userRepository.addVerifiedDevice(userId, deviceFingerprint);
  }

  async updateUser(
    query: FilterQuery<User>,
    data: UpdateUserDto,
  ): Promise<User | null> {
    const user = await this.userRepository.updateUser(query, data);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findUser({ _id: id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.deleteUser(id);
  }
}
