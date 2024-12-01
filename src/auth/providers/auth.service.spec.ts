import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../../user/providers/user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    _id: new Types.ObjectId('67464220a978f5889273313c'),
    email: 'test@example.com',
    username: 'testuser',
    password: '$2a$10$.knUxhY/oDGHR1MoCC530.IS0PE1k77cHHnrZa0fB0XsqIvfOSZUy',
    createdAt: new Date('2024-11-26T21:48:16.809Z'),
    updatedAt: new Date('2024-11-26T21:48:16.809Z'),
    __v: 0,
  };

  const mockUserWithoutPassword = {
    _id: mockUser._id,
    email: mockUser.email,
    username: mockUser.username,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
    __v: mockUser.__v,
  };

  beforeEach(async () => {
    const mockUserService = {
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      userService.getUserByEmail.mockResolvedValue(mockUser as unknown as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUserWithoutPassword);
      expect(userService.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
    });

    it('should return null when user is not found', async () => {
      userService.getUserByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      userService.getUserByEmail.mockResolvedValue(mockUser as unknown as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return access token when login is successful', async () => {
      jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(mockUserWithoutPassword);
      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'mock-token',
        userId: mockUser._id,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should create a new user', async () => {
      userService.createUser.mockResolvedValue(mockUser as unknown as User);

      const result = await service.register(registerDto);

      expect(result).toEqual(mockUser);
      expect(userService.createUser).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile when user exists', async () => {
      userService.getUserById.mockResolvedValue(mockUser as unknown as User);

      const result = await service.getProfile('67464220a978f5889273313c');

      expect(result).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(
        '67464220a978f5889273313c',
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userService.getUserById.mockResolvedValue(null);

      await expect(
        service.getProfile('67464220a978f5889273313c'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
