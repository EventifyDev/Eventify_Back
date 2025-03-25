import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../../user/providers/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { RoleService } from '../../roles/providers/role.service';
import { getModelToken } from '@nestjs/mongoose';
import { BlacklistedRefreshToken } from '../schemas/blacklisted-refresh-token.schema';
import {
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;
  let emailService: EmailService;
  let rolesService: RoleService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  const mockUser = {
    _id: 'user-id-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    isEmailVerified: false,
    createdAt: new Date(),
    verifiedDevices: [],
    toObject: () => ({
      _id: 'user-id-123',
      email: 'test@example.com',
      username: 'testuser',
      isEmailVerified: false,
      createdAt: new Date(),
      verifiedDevices: [],
    }),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  const mockRequest = {
    headers: { 'user-agent': 'test-agent' },
    ip: '127.0.0.1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findUserByEmailWithPassword: jest.fn(),
            findUserByEmail: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            getUser: jest.fn(),
            addVerifiedDevice: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmailVerificationEmail: jest.fn(),
            sendRegistrationEmail: jest.fn(),
            sendDeviceVerificationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
            sendPasswordChangeConfirmationEmail: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            findByName: jest.fn(),
            assignRoleToUser: jest.fn(),
            getUserWithRole: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              const values = {
                JWT_ACCESS_TOKEN_SECRET: 'access-secret',
                JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
                JWT_ACCESS_TOKEN_EXPIRATION_MS: 900000,
                JWT_REFRESH_TOKEN_EXPIRATION_MS: 604800000,
              };
              return values[key];
            }),
            getOrThrow: jest.fn().mockImplementation((key) => {
              const values = {
                JWT_ACCESS_TOKEN_SECRET: 'access-secret',
                JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
                JWT_ACCESS_TOKEN_EXPIRATION_MS: 900000,
                JWT_REFRESH_TOKEN_EXPIRATION_MS: 604800000,
              };
              return values[key];
            }),
          },
        },
        {
          provide: getModelToken(BlacklistedRefreshToken.name),
          useValue: {
            create: jest.fn(),
            deleteMany: jest.fn().mockReturnValue({
              exec: jest.fn(),
            }),
            countDocuments: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(0),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    rolesService = module.get<RoleService>(RoleService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock bcrypt
    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation((plain) =>
        Promise.resolve(plain === 'Password123!' || plain === 'refresh-token'),
      );
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation((data) => Promise.resolve(`hashed-${data}`));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
        role: 'Participant',
      };

      jest.spyOn(userService, 'createUser').mockResolvedValue(mockUser as any);
      jest
        .spyOn(rolesService, 'findByName')
        .mockResolvedValue({ _id: 'role-id', name: 'Participant' } as any);

      const result = await service.register(registerDto);

      expect(userService.createUser).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        username: registerDto.username,
      });

      expect(rolesService.assignRoleToUser).toHaveBeenCalled();
      expect(emailService.sendEmailVerificationEmail).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ForbiddenException if trying to register as admin', async () => {
      const registerDto: RegisterDto = {
        email: 'admin@example.com',
        password: 'Password123!',
        username: 'admin',
        role: 'Administrator',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens for valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      jest
        .spyOn(userService, 'findUserByEmailWithPassword')
        .mockResolvedValue(mockUser as any);
      jest.spyOn(userService, 'getUser').mockResolvedValue({
        ...mockUser,
        verifiedDevices: ['some-device-fingerprint'],
      } as any);
      jest
        .spyOn(service as any, 'generateDeviceFingerprint')
        .mockReturnValue('some-device-fingerprint');

      const result = await service.login(
        loginDto,
        mockResponse as any,
        mockRequest as any,
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('userId');
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword!',
      };

      jest
        .spyOn(userService, 'findUserByEmailWithPassword')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        service.login(loginDto, mockResponse as any, mockRequest as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should require device verification for new devices', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      jest
        .spyOn(userService, 'findUserByEmailWithPassword')
        .mockResolvedValue(mockUser as any);
      jest.spyOn(userService, 'getUser').mockResolvedValue(mockUser as any);
      jest
        .spyOn(service as any, 'generateDeviceFingerprint')
        .mockReturnValue('new-device-fingerprint');

      const result = await service.login(
        loginDto,
        mockResponse as any,
        mockRequest as any,
      );

      expect(result).toHaveProperty('requiresDeviceVerification', true);
      expect(userService.updateUser).toHaveBeenCalled();
      expect(emailService.sendDeviceVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should verify email with valid OTP', async () => {
      const email = 'test@example.com';
      const otpCode = '123456';

      const userWithOtp = {
        ...mockUser,
        otpCreatedAt: new Date(),
      };

      jest
        .spyOn(userService, 'findUserByEmail')
        .mockResolvedValue(userWithOtp as any);
      jest
        .spyOn(service as any, 'generateDeterministicOtp')
        .mockReturnValue(otpCode);

      const result = await service.verifyOtp(email, otpCode);

      expect(result).toBe(true);
      expect(userService.updateUser).toHaveBeenCalledWith(userWithOtp._id, {
        isEmailVerified: true,
        otpCreatedAt: null,
      });
      expect(emailService.sendRegistrationEmail).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      const email = 'test@example.com';
      const otpCode = '123456';

      const userWithOtp = {
        ...mockUser,
        otpCreatedAt: new Date(),
      };

      jest
        .spyOn(userService, 'findUserByEmail')
        .mockResolvedValue(userWithOtp as any);
      jest
        .spyOn(service as any, 'generateDeterministicOtp')
        .mockReturnValue('654321');

      await expect(service.verifyOtp(email, otpCode)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userService, 'findUserByEmail').mockResolvedValue(null);

      await expect(
        service.verifyOtp('nonexistent@example.com', '123456'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without sensitive fields', async () => {
      const userId = 'user-id-123';
      const userWithSensitiveData = {
        ...mockUser,
        password: 'hashedPassword',
        refreshToken: 'someRefreshToken',
      };

      jest
        .spyOn(userService, 'getUser')
        .mockResolvedValue(userWithSensitiveData as any);

      const result = await service.getProfile(userId);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result).toHaveProperty('email', mockUser.email);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userService, 'getUser').mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('logout', () => {
    it('should clear cookies and update user', async () => {
      const userId = 'user-id-123';

      await service.logout(userId, mockResponse as any);

      expect(userService.updateUser).toHaveBeenCalledWith(
        { _id: userId },
        { refreshToken: null },
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Authentication');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Refresh');
    });
  });
});
