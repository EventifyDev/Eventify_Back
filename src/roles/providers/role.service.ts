import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Role } from '@/schemas/role.schema';
import { CreateRoleDto } from '@/dto/create-role.dto';
import { UpdateRoleDto } from '@/dto/update-role.dto';
import { IRoleService } from '@/interfaces/role-service.interface';
import { RoleRepository } from '@/repositories/role.repository';

@Injectable()
export class RoleService implements IRoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(private readonly roleRepository: RoleRepository) {
    this.initializeRoles();
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
        permissions: ['manage:events', 'read:events', 'read:participants'],
        description: 'Event creation and management',
      },
      {
        name: 'Participant',
        permissions: ['participate:events', 'read:events'],
        description: 'Event participation',
      },
    ];

    for (const roleData of defaultRoles) {
      try {
        const existingRole = await this.roleRepository.findByName(
          roleData.name,
        );
        if (!existingRole) {
          await this.create(roleData);
          this.logger.log(`Created default role: ${roleData.name}`);
        } else {
          this.logger.debug(`Role ${roleData.name} already exists`);
        }
      } catch (error) {
        // Skip if error is not related to role not found
        if (!(error instanceof NotFoundException)) {
          this.logger.error(
            `Error creating role ${roleData.name}: ${error.message}`,
          );
        }
      }
    }
  }
}
