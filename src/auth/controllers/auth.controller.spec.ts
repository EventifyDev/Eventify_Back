import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../providers/auth.service';
import { Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    _id: new Types.ObjectId('67464220a978f5889273313c'),
    email: 'test@example.com',
    username: 'testuser',
    password: '$2a$10$.knUxhY/oDGHR1MoCC530.IS0PE1k77cHHnrZa0fB0XsqIvfOSZUy',
    createdAt: new Date('2024-11-26T21:48:16.809Z'),
    updatedAt: new Date('2024-11-26T21:48:16.809Z'),
    __v: 0,
  };

  const mockLoginResponse = {
    access_token: 'mock-jwt-token',
    userId: mockUser._id,
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should register a new user', async () => {
      authService.register.mockResolvedValue(mockUser as unknown as User);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user and return access token', async () => {
      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('userId');
    });
  });

  describe('getProfile', () => {
    const userId = '67464220a978f5889273313c';

    it('should return user profile', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      authService.getProfile.mockResolvedValue(
        userWithoutPassword as unknown as User,
      );

      const result = await controller.getProfile(userId);

      expect(authService.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(userWithoutPassword);
      expect(result).not.toHaveProperty('password');
    });
  });
});
