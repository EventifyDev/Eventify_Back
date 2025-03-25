import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../providers/auth.service';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock response object
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };

  // Mock request object
  const mockRequest = {
    user: { _id: 'user-id' },
    cookies: {},
    headers: { authorization: '' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            verifyOtp: jest.fn(),
            resendOtp: jest.fn(),
            verifyDevice: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            getProfile: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3000'),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with registerDto', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
        role: 'Participant',
      };

      const expectedResult = {
        _id: 'user-id-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'Participant',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        verifiedDevices: [],
      };

      jest
        .spyOn(authService, 'register')
        .mockResolvedValue(expectedResult as any);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should return device verification response when required', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      jest.spyOn(authService, 'login').mockResolvedValue({
        requiresDeviceVerification: true,
        email: loginDto.email,
      } as any);

      await controller.login(loginDto, mockResponse as any, mockRequest as any);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        mockResponse,
        mockRequest,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        requiresDeviceVerification: true,
        email: loginDto.email,
        message: 'Device verification required',
      });
    });

    it('should return login result when successful', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const loginResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-id', email: 'test@example.com' },
      };

      jest.spyOn(authService, 'login').mockResolvedValue(loginResult as any);

      await controller.login(loginDto, mockResponse as any, mockRequest as any);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        mockResponse,
        mockRequest,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(loginResult);
    });
  });

  describe('verifyOtp', () => {
    it('should call authService.verifyOtp with correct params', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        email: 'test@example.com',
        otpCode: '123456',
      };

      jest.spyOn(authService, 'verifyOtp').mockResolvedValue(true);

      const result = await controller.verifyOtp(verifyOtpDto);

      expect(authService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpDto.email,
        verifyOtpDto.otpCode,
      );
      expect(result).toEqual({
        success: true,
        message: 'Email verified successfully',
      });
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile with userId', async () => {
      const userId = 'user-id';
      const profileData = { id: userId, email: 'test@example.com' };

      jest
        .spyOn(authService, 'getProfile')
        .mockResolvedValue(profileData as any);

      const result = await controller.getProfile(userId);

      expect(authService.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(profileData);
    });
  });

  describe('logout', () => {
    it('should clear cookies and call authService.logout', async () => {
      jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      const result = await controller.logout(
        mockRequest as any,
        mockResponse as any,
      );

      expect(authService.logout).toHaveBeenCalledWith('user-id', mockResponse);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Authentication');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Refresh');
      expect(result).toEqual({ success: true });
    });
  });
});
