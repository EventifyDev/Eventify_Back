import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { IUserService } from '../interfaces/user.interface';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { FilterQuery } from 'mongoose';
import { RoleService } from '../../roles/providers/role.service';

@Injectable()
export class UserService implements IUserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
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

  async findUserByUsernameWithPassword(username: string): Promise<User | null> {
    this.logger.debug(`Finding user by username with password: ${username}`);
    try {
      return this.userRepository.findUserWithPassword({
        username: username.toLowerCase(),
      });
    } catch (error) {
      this.logger.error(`Error finding user by username: ${error.message}`);
      return null;
    }
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findUser({ username: username.toLowerCase() });
  }

  async createAdminUser(adminData: {
    username: string;
    email: string;
    password: string;
    roleName: string;
  }): Promise<User> {
    const username = adminData.username.toLowerCase();
    const existingUser = await this.findUserByUsername(username);
    if (existingUser) {
      this.logger.log(`Admin user ${username} already exists`);
      return existingUser;
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const newUser = await this.userRepository.createUser({
      username: username,
      email: adminData.email.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: true,
    });

    try {
      const role = await this.roleService.findByName(adminData.roleName);
      const roleId = (role as any)._id.toString();
      await this.roleService.assignRoleToUser(newUser._id.toString(), roleId);
      this.logger.log(
        `Role ${adminData.roleName} assigned to admin ${username}`,
      );
    } catch (error) {
      this.logger.error(`Failed to assign role to admin: ${error.message}`);
    }

    return newUser;
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
