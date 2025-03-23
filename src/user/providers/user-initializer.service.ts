import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserInitializerService implements OnModuleInit {
  private readonly logger = new Logger(UserInitializerService.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeAdminUsers();
  }

  async initializeAdminUsers() {
    const adminUsers = [
      {
        username: 'superadmin',
        email: 'superadmin@eventify.com',
        password:
          this.configService.get<string>('SUPER_ADMIN_PASSWORD') ||
          'SuperAdmin123!',
        roleName: 'Super Admin',
      },
      {
        username: 'admin',
        email: 'elmorjanimohamed200@gmail.com',
        password:
          this.configService.get<string>('ADMIN_PASSWORD') || 'Admin123!',
        roleName: 'Administrator',
      },
    ];

    this.logger.log('Initializing admin accounts...');

    for (const adminData of adminUsers) {
      try {
        await this.userService.createAdminUser(adminData);
        this.logger.log(
          `Admin account created or verified: ${adminData.username}`,
        );
      } catch (error) {
        this.logger.error(
          `Error creating admin account ${adminData.username}: ${error.message}`,
          error.stack,
        );
      }
    }

    this.logger.log('Admin account initialization complete');
  }
}
