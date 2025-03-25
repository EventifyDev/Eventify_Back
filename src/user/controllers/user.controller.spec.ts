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
  let userService: UserService;

  const mockUser = {
    _id: 'user-id-1',
    email: 'test@example.com',
    username: 'testuser',
    role: 'Participant',
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsers = [
    mockUser,
    {
      _id: 'user-id-2',
      email: 'test2@example.com',
      username: 'testuser2',
      role: 'Organizer',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn(),
            getAllUsers: jest.fn(),
            getUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      jest.spyOn(userService, 'createUser').mockResolvedValue(mockUser as any);

      const result = await controller.createUser(createUserDto);

      expect(userService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      jest
        .spyOn(userService, 'getAllUsers')
        .mockResolvedValue(mockUsers as any);

      const result = await controller.getAllUsers();

      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      jest.spyOn(userService, 'getUser').mockResolvedValue(mockUser as any);

      const result = await controller.getUserById('user-id-1');

      expect(userService.getUser).toHaveBeenCalledWith({ _id: 'user-id-1' });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userService, 'getUser').mockResolvedValue(null);

      await expect(controller.getUserById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.getUser).toHaveBeenCalledWith({
        _id: 'non-existent-id',
      });
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        username: 'updateduser',
      };

      const updatedUser = {
        ...mockUser,
        username: 'updateduser',
      };

      jest
        .spyOn(userService, 'updateUser')
        .mockResolvedValue(updatedUser as any);

      const result = await controller.updateUser('user-id-1', updateUserDto);

      expect(userService.updateUser).toHaveBeenCalledWith(
        { _id: 'user-id-1' },
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      jest.spyOn(userService, 'deleteUser').mockResolvedValue(undefined);

      await controller.deleteUser('user-id-1');

      expect(userService.deleteUser).toHaveBeenCalledWith('user-id-1');
    });
  });
});
