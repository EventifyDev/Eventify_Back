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

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
  ) {}

  async createUser(userDto: CreateUserDto): Promise<User> {
    const existingEmail = await this.userRepository.findUserByEmail(
      userDto.email.toLowerCase(),
    );
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUsername = await this.userRepository.findUserByUsername(
      userDto.username.toLowerCase(),
    );
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

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(id: string, userDto: UpdateUserDto): Promise<User | null> {
    const user = await this.userRepository.updateUser(id, userDto);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.deleteUser(id);
  }
}
