import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { Role, RoleDocument } from '../schemas/role.schema';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { IRoleService } from '../interfaces/role-service.interface';
import { IRoleRepository } from '../interfaces/role-repository.interface';
import { User } from '../../user/schemas/user.schema';
import { IUserRepository } from '../../user/interfaces/user.repository.interface';

@Injectable()
export class RoleService implements IRoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async onModuleInit() {
    await this.initializeRoles();
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findByName(name);
    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }
    return role;
  }

  async getUserWithRole(userId: string): Promise<User> {
    return this.roleRepository.getUserWithRole(userId);
  }

  async getUsersByRoleNames(roleNames: string[]): Promise<User[]> {
    this.logger.debug(`Finding users with roles: ${roleNames.join(', ')}`);

    try {
      const roles = await this.roleRepository.findRolesByNames(roleNames);

      if (!roles.length) {
        this.logger.warn(`No roles found with names: ${roleNames.join(', ')}`);
        return [];
      }

      const roleIds = roles.map((role) =>
        (role as RoleDocument)._id.toString(),
      );

      const users = await this.userRepository.findUsersByRoleIds(roleIds);

      this.logger.debug(`Found ${users.length} users with specified roles`);
      return users;
    } catch (error) {
      this.logger.error(
        `Error finding users by role names: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve users by role names',
      );
    }
  }

  async findRolesByNames(names: string[]): Promise<Role[]> {
    this.logger.debug(`Finding roles with names: ${names.join(', ')}`);

    try {
      const roles = await this.roleRepository.findRolesByNames(names);
      this.logger.debug(`Found ${roles.length} roles`);
      return roles;
    } catch (error) {
      this.logger.error(
        `Error finding roles by names: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve roles by names',
      );
    }
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      return await this.roleRepository.create(createRoleDto);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Role with this name already exists');
      }
      throw error;
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const updatedRole = await this.roleRepository.update(id, updateRoleDto);
    if (!updatedRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return updatedRole;
  }

  async remove(id: string): Promise<void> {
    const result = await this.roleRepository.remove(id);
    if (!result) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<any> {
    // First verify the role exists
    await this.findOne(roleId);

    const updatedUser = await this.roleRepository.assignRoleToUser(
      userId,
      roleId,
    );
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return updatedUser;
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.roleRepository.getUserWithRole(userId);

    if (!user || !user.role) {
      return false;
    }

    const role = user.role as Role;

    // Super Admin has access to everything
    if (role.name === 'Super Admin') {
      return true;
    }

    return role.permissions.includes(permission);
  }

  async initializeRoles(): Promise<void> {
    const defaultRoles = [
      {
        name: 'Super Admin',
        permissions: ['*'],
        description: 'Full access to all system features',
      },
      {
        name: 'Administrator',
        permissions: [
          'manage:users',
          'read:users',
          'read:roles',
          'read:events',
          'manage:events',
        ],
        description: 'User management and role access',
      },
      {
        name: 'Organizer',
        permissions: [
          'manage:events',
          'read:events',
          'read:participants',
          'read:roles',
        ],
        description: 'Event creation and management',
      },
      {
        name: 'Participant',
        permissions: ['participate:events', 'read:events'],
        description: 'Event participation',
      },
    ];

    this.logger.log('Initializing default roles...');

    for (const roleData of defaultRoles) {
      await this.createRoleIfNotExists(roleData);
    }

    this.logger.log('Default roles initialization completed');
  }

  private async createRoleIfNotExists(roleData: any): Promise<void> {
    try {
      // Check if role exists
      await this.findByName(roleData.name);
      this.logger.debug(`Role ${roleData.name} already exists`);
      return;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Error finding role ${roleData.name}: ${error.message}`,
        );
        return;
      }

      this.tryCreateRole(roleData);
    }
  }

  private async tryCreateRole(roleData: any): Promise<void> {
    try {
      await this.roleRepository.create(roleData);
      this.logger.log(`Created default role: ${roleData.name}`);
    } catch (error) {
      if (error.code === 11000) {
        this.logger.debug(
          `Role ${roleData.name} was created concurrently by another process`,
        );
      } else {
        this.logger.error(
          `Failed to create role ${roleData.name}: ${error.message}`,
        );
      }
    }
  }
}
