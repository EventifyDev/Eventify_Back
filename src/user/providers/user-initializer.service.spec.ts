import { Test, TestingModule } from '@nestjs/testing';
import { UserInitializerService } from './user-initializer.service';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('UserInitializerService', () => {
  let service: UserInitializerService;
  let userService: UserService;
  let configService: ConfigService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserInitializerService,
        {
          provide: UserService,
          useValue: {
            createAdminUser: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserInitializerService>(UserInitializerService);
    userService = module.get<UserService>(UserService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock the logger
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call initializeAdminUsers', async () => {
      const initSpy = jest
        .spyOn(service, 'initializeAdminUsers')
        .mockResolvedValue();

      await service.onModuleInit();

      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('initializeAdminUsers', () => {
    it('should initialize superadmin and admin users with config passwords', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'SUPER_ADMIN_PASSWORD') return 'ConfigSuperAdmin123!';
        if (key === 'ADMIN_PASSWORD') return 'ConfigAdmin123!';
        return null;
      });

      await service.initializeAdminUsers();

      expect(userService.createAdminUser).toHaveBeenCalledTimes(2);
      expect(userService.createAdminUser).toHaveBeenCalledWith({
        username: 'superadmin',
        email: 'superadmin@eventify.com',
        password: 'ConfigSuperAdmin123!',
        roleName: 'Super Admin',
      });
      expect(userService.createAdminUser).toHaveBeenCalledWith({
        username: 'admin',
        email: 'elmorjanimohamed200@gmail.com',
        password: 'ConfigAdmin123!',
        roleName: 'Administrator',
      });
      expect(loggerSpy).toHaveBeenCalledWith(
        'Admin account initialization complete',
      );
    });

    it('should use default passwords when config values are not available', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);

      await service.initializeAdminUsers();

      expect(userService.createAdminUser).toHaveBeenCalledTimes(2);
      expect(userService.createAdminUser).toHaveBeenCalledWith({
        username: 'superadmin',
        email: 'superadmin@eventify.com',
        password: 'SuperAdmin123!',
        roleName: 'Super Admin',
      });
      expect(userService.createAdminUser).toHaveBeenCalledWith({
        username: 'admin',
        email: 'elmorjanimohamed200@gmail.com',
        password: 'Admin123!',
        roleName: 'Administrator',
      });
    });

    it('should handle errors when creating admin users', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const error = new Error('Creation failed');

      jest.spyOn(userService, 'createAdminUser').mockRejectedValueOnce(error);

      await service.initializeAdminUsers();

      expect(errorSpy).toHaveBeenCalledWith(
        'Error creating admin account superadmin: Creation failed',
        error.stack,
      );
      expect(userService.createAdminUser).toHaveBeenCalledTimes(2);
    });
  });
});
