import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { RoleService } from '../../roles/providers/role.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import * as bcrypt from 'bcryptjs';

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;
  let roleService: RoleService;

  const mockUser = {
    _id: 'user-id-1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
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
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    // Mock bcrypt
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(() => Promise.resolve('hashedPassword'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'UserRepository',
          useValue: {
            createUser: jest.fn(),
            findAllUsers: jest.fn(),
            findUser: jest.fn(),
            findUserWithPassword: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
            addVerifiedDevice: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            findByName: jest.fn(),
            assignRoleToUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>('UserRepository');
    roleService = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      jest.spyOn(userRepository, 'findUser').mockResolvedValueOnce(null); // email check
      jest.spyOn(userRepository, 'findUser').mockResolvedValueOnce(null); // username check
      jest
        .spyOn(userRepository, 'createUser')
        .mockResolvedValue(mockUser as any);

      const result = await service.createUser(createUserDto);

      expect(userRepository.findUser).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(userRepository.findUser).toHaveBeenCalledWith({
        username: 'testuser',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(userRepository.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'Password123!',
      };

      jest
        .spyOn(userRepository, 'findUser')
        .mockResolvedValueOnce(mockUser as any); // Existing email

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findUser).toHaveBeenCalledWith({
        email: 'existing@example.com',
      });
    });

    it('should throw ConflictException if username already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        username: 'existinguser',
        password: 'Password123!',
      };

      jest.spyOn(userRepository, 'findUser').mockResolvedValueOnce(null); // Email check
      jest
        .spyOn(userRepository, 'findUser')
        .mockResolvedValueOnce(mockUser as any); // Existing username

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findUser).toHaveBeenCalledWith({
        email: 'new@example.com',
      });
      expect(userRepository.findUser).toHaveBeenCalledWith({
        username: 'existinguser',
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      jest
        .spyOn(userRepository, 'findAllUsers')
        .mockResolvedValue(mockUsers as any);

      const result = await service.getAllUsers();

      expect(userRepository.findAllUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUser', () => {
    it('should return a user by query', async () => {
      const query = { _id: 'user-id-1' };

      jest.spyOn(userRepository, 'findUser').mockResolvedValue(mockUser as any);

      const result = await service.getUser(query);

      expect(userRepository.findUser).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const query = { _id: 'non-existent-id' };

      jest.spyOn(userRepository, 'findUser').mockResolvedValue(null);

      await expect(service.getUser(query)).rejects.toThrow(NotFoundException);
      expect(userRepository.findUser).toHaveBeenCalledWith(query);
    });
  });

  describe('findUserByEmail', () => {
    it('should find a user by email', async () => {
      jest.spyOn(userRepository, 'findUser').mockResolvedValue(mockUser as any);

      const result = await service.findUserByEmail('test@example.com');

      expect(userRepository.findUser).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by email', async () => {
      jest.spyOn(userRepository, 'findUser').mockResolvedValue(null);

      const result = await service.findUserByEmail('nonexistent@example.com');

      expect(userRepository.findUser).toHaveBeenCalledWith({
        email: 'nonexistent@example.com',
      });
      expect(result).toBeNull();
    });
  });

  describe('findUserByEmailWithPassword', () => {
    it('should find a user with password by email', async () => {
      jest
        .spyOn(userRepository, 'findUserWithPassword')
        .mockResolvedValue(mockUser as any);

      const result =
        await service.findUserByEmailWithPassword('test@example.com');

      expect(userRepository.findUserWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const query = { _id: 'user-id-1' };
      const updateUserDto: UpdateUserDto = {
        username: 'updateduser',
      };

      const updatedUser = {
        ...mockUser,
        username: 'updateduser',
      };

      jest
        .spyOn(userRepository, 'updateUser')
        .mockResolvedValue(updatedUser as any);

      const result = await service.updateUser(query, updateUserDto);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        query,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user to update not found', async () => {
      const query = { _id: 'non-existent-id' };
      const updateUserDto: UpdateUserDto = {
        username: 'updateduser',
      };

      jest.spyOn(userRepository, 'updateUser').mockResolvedValue(null);

      await expect(service.updateUser(query, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.updateUser).toHaveBeenCalledWith(
        query,
        updateUserDto,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      jest.spyOn(userRepository, 'findUser').mockResolvedValue(mockUser as any);
      jest.spyOn(userRepository, 'deleteUser').mockResolvedValue(undefined);

      await service.deleteUser('user-id-1');

      expect(userRepository.findUser).toHaveBeenCalledWith({
        _id: 'user-id-1',
      });
      expect(userRepository.deleteUser).toHaveBeenCalledWith('user-id-1');
    });

    it('should throw NotFoundException if user to delete not found', async () => {
      jest.spyOn(userRepository, 'findUser').mockResolvedValue(null);

      await expect(service.deleteUser('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.findUser).toHaveBeenCalledWith({
        _id: 'non-existent-id',
      });
      expect(userRepository.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('createAdminUser', () => {
    it('should create an admin user if it does not exist', async () => {
      const adminData = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'AdminPass123!',
        roleName: 'Administrator',
      };

      const newAdmin = {
        _id: 'admin-id',
        username: 'admin',
        email: 'admin@example.com',
        isEmailVerified: true,
      };

      const adminRole = {
        _id: 'role-id',
        name: 'Administrator',
      };

      jest.spyOn(userRepository, 'findUser').mockResolvedValue(null); // Admin not found
      jest
        .spyOn(userRepository, 'createUser')
        .mockResolvedValue(newAdmin as any);
      jest.spyOn(roleService, 'findByName').mockResolvedValue(adminRole as any);

      const result = await service.createAdminUser(adminData);

      expect(userRepository.findUser).toHaveBeenCalledWith({
        username: 'admin',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('AdminPass123!', 10);
      expect(userRepository.createUser).toHaveBeenCalledWith({
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashedPassword',
        isEmailVerified: true,
      });
      expect(roleService.findByName).toHaveBeenCalledWith('Administrator');
      expect(roleService.assignRoleToUser).toHaveBeenCalledWith(
        'admin-id',
        'role-id',
      );
      expect(result).toEqual(newAdmin);
    });

    it('should return existing admin user if username already exists', async () => {
      const adminData = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'AdminPass123!',
        roleName: 'Administrator',
      };

      const existingAdmin = {
        _id: 'admin-id',
        username: 'admin',
        email: 'admin@example.com',
        isEmailVerified: true,
      };

      jest
        .spyOn(userRepository, 'findUser')
        .mockResolvedValue(existingAdmin as any);

      const result = await service.createAdminUser(adminData);

      expect(userRepository.findUser).toHaveBeenCalledWith({
        username: 'admin',
      });
      expect(userRepository.createUser).not.toHaveBeenCalled();
      expect(result).toEqual(existingAdmin);
    });
  });

  describe('addVerifiedDevice', () => {
    it('should add a verified device to user', async () => {
      jest
        .spyOn(userRepository, 'addVerifiedDevice')
        .mockResolvedValue(undefined);

      await service.addVerifiedDevice('user-id-1', 'device-fingerprint');

      expect(userRepository.addVerifiedDevice).toHaveBeenCalledWith(
        'user-id-1',
        'device-fingerprint',
      );
    });
  });
});
