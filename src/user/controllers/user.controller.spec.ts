import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../providers/user.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import { User } from '../schemas/user.schema';
import { Types } from 'mongoose';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    _id: new Types.ObjectId('67464220a978f5889273313c'),
    username: 'adil40988',
    email: 'test12@example.com',
    password: '$2a$10$.knUxhY/oDGHR1MoCC530.IS0PE1k77cHHnrZa0fB0XsqIvfOSZUy',
    createdAt: new Date('2024-11-26T21:48:16.809Z'),
    updatedAt: new Date('2024-11-26T21:48:16.809Z'),
    __v: 0,
  } as unknown as User;

  beforeEach(async () => {
    const mockUserService = {
      createUser: jest.fn(),
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'test12@example.com',
      username: 'adil40988',
      password: 'password123',
    };

    it('should create a new user', async () => {
      userService.createUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(createUserDto);

      expect(userService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      userService.getAllUsers.mockResolvedValue(users);

      const result = await controller.getAllUsers();

      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      userService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById('67464220a978f5889273313c');

      expect(userService.getUserById).toHaveBeenCalledWith(
        '67464220a978f5889273313c',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userService.getUserById.mockResolvedValue(null);

      await expect(
        controller.getUserById('67464220a978f5889273313c'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
    };

    it('should update a user', async () => {
      const updatedUser = {
        ...mockUser,
        email: updateUserDto.email,
        updatedAt: new Date(),
      } as unknown as User;

      userService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(
        '67464220a978f5889273313c',
        updateUserDto,
      );

      expect(userService.updateUser).toHaveBeenCalledWith(
        '67464220a978f5889273313c',
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      userService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteUser('67464220a978f5889273313c');

      expect(userService.deleteUser).toHaveBeenCalledWith(
        '67464220a978f5889273313c',
      );
    });
  });
});
