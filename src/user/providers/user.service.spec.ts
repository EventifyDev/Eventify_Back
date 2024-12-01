import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: any;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    mockUserRepository = {
      findUserByEmail: jest.fn(),
      findUserByUsername: jest.fn(),
      createUser: jest.fn(),
      findAllUsers: jest.fn(),
      findUserById: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      mockUserRepository.findUserByEmail.mockResolvedValue(null);
      mockUserRepository.findUserByUsername.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      mockUserRepository.findUserById.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findUserById.mockResolvedValue(null);

      await expect(service.getUserById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserRepository.updateUser.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', updateUserDto);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockUserRepository.deleteUser.mockResolvedValue(undefined);

      await expect(service.deleteUser('1')).resolves.not.toThrow();
    });
  });
});
