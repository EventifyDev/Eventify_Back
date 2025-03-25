import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Role } from '../schemas/role.schema';
import { User } from '../../user/schemas/user.schema';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: any;
  let userRepository: any;

  const mockRole = {
    _id: 'role-id-1',
    name: 'Test Role',
    permissions: ['read:users', 'write:users'],
    description: 'A test role',
  } as unknown as Role;

  const mockRoles = [
    mockRole,
    {
      _id: 'role-id-2',
      name: 'Admin Role',
      permissions: ['manage:all'],
      description: 'An admin role',
    } as unknown as Role,
  ];

  const mockUser: Partial<User> = {
    _id: 'user-id-1',
    email: 'test@example.com',
    username: 'testuser',
    role: mockRole as any,
  };

  beforeEach(async () => {
    roleRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getUserWithRole: jest.fn(),
      assignRoleToUser: jest.fn(),
      findRolesByNames: jest.fn(),
    };

    userRepository = {
      findUsersByRoleIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: 'IRoleRepository',
          useValue: roleRepository,
        },
        {
          provide: 'IUserRepository',
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    // Mock the logger to prevent console output during tests
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'debug').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      roleRepository.findAll.mockResolvedValue(mockRoles);

      const result = await service.findAll();

      expect(roleRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockRoles);
    });
  });

  describe('findOne', () => {
    it('should return a role if found', async () => {
      roleRepository.findById.mockResolvedValue(mockRole);

      const result = await service.findOne('role-id-1');

      expect(roleRepository.findById).toHaveBeenCalledWith('role-id-1');
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByName', () => {
    it('should return a role if found by name', async () => {
      roleRepository.findByName.mockResolvedValue(mockRole);

      const result = await service.findByName('Test Role');

      expect(roleRepository.findByName).toHaveBeenCalledWith('Test Role');
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found by name', async () => {
      roleRepository.findByName.mockResolvedValue(null);

      await expect(service.findByName('Non-existent Role')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserWithRole', () => {
    it('should return a user with role', async () => {
      roleRepository.getUserWithRole.mockResolvedValue(mockUser);

      const result = await service.getUserWithRole('user-id-1');

      expect(roleRepository.getUserWithRole).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUsersByRoleNames', () => {
    it('should return users with specific roles', async () => {
      roleRepository.findRolesByNames.mockResolvedValue(mockRoles);
      userRepository.findUsersByRoleIds.mockResolvedValue([mockUser]);

      const result = await service.getUsersByRoleNames([
        'Test Role',
        'Admin Role',
      ]);

      expect(roleRepository.findRolesByNames).toHaveBeenCalledWith([
        'Test Role',
        'Admin Role',
      ]);
      expect(userRepository.findUsersByRoleIds).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });

    it('should return empty array if no roles found', async () => {
      roleRepository.findRolesByNames.mockResolvedValue([]);

      const result = await service.getUsersByRoleNames(['Non-existent Role']);

      expect(roleRepository.findRolesByNames).toHaveBeenCalledWith([
        'Non-existent Role',
      ]);
      expect(userRepository.findUsersByRoleIds).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException if an error occurs', async () => {
      roleRepository.findRolesByNames.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getUsersByRoleNames(['Test Role'])).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'New Role',
        permissions: ['read:users'],
        description: 'A new role',
      };

      roleRepository.create.mockResolvedValue({
        ...createRoleDto,
        _id: 'new-role-id',
      });

      const result = await service.create(createRoleDto);

      expect(roleRepository.create).toHaveBeenCalledWith(createRoleDto);
      expect(result).toEqual({ ...createRoleDto, _id: 'new-role-id' });
    });

    it('should throw ConflictException if role with name already exists', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Existing Role',
        permissions: ['read:users'],
        description: 'A role',
      };

      const error = new Error('Duplicate key');
      error['code'] = 11000;
      roleRepository.create.mockRejectedValue(error);

      await expect(service.create(createRoleDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing role', async () => {
      const updateRoleDto: UpdateRoleDto = {
        permissions: ['read:users', 'write:users', 'delete:users'],
        description: 'Updated description',
      };

      const updatedRole = {
        ...mockRole,
        permissions: ['read:users', 'write:users', 'delete:users'],
        description: 'Updated description',
      };

      roleRepository.update.mockResolvedValue(updatedRole);

      const result = await service.update('role-id-1', updateRoleDto);

      expect(roleRepository.update).toHaveBeenCalledWith(
        'role-id-1',
        updateRoleDto,
      );
      expect(result).toEqual(updatedRole);
    });

    it('should throw NotFoundException if role to update not found', async () => {
      const updateRoleDto: UpdateRoleDto = {
        permissions: ['read:users', 'write:users'],
        description: 'Updated description',
      };

      roleRepository.update.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateRoleDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an existing role', async () => {
      roleRepository.remove.mockResolvedValue({
        acknowledged: true,
        deletedCount: 1,
      });

      await service.remove('role-id-1');

      expect(roleRepository.remove).toHaveBeenCalledWith('role-id-1');
    });

    it('should throw NotFoundException if role to remove not found', async () => {
      roleRepository.remove.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.assignRoleToUser.mockResolvedValue({
        ...mockUser,
        role: mockRole,
      });

      const result = await service.assignRoleToUser('user-id-1', 'role-id-1');

      expect(roleRepository.findById).toHaveBeenCalledWith('role-id-1');
      expect(roleRepository.assignRoleToUser).toHaveBeenCalledWith(
        'user-id-1',
        'role-id-1',
      );
      expect(result).toEqual({ ...mockUser, role: mockRole });
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepository.findById.mockResolvedValue(null);

      await expect(
        service.assignRoleToUser('user-id-1', 'non-existent-role'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.assignRoleToUser.mockResolvedValue(null);

      await expect(
        service.assignRoleToUser('non-existent-user', 'role-id-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has the requested permission', async () => {
      roleRepository.getUserWithRole.mockResolvedValue({
        ...mockUser,
        role: { ...mockRole, permissions: ['read:users'] },
      });

      const result = await service.hasPermission('user-id-1', 'read:users');

      expect(roleRepository.getUserWithRole).toHaveBeenCalledWith('user-id-1');
      expect(result).toBe(true);
    });

    it('should return false if user does not have the requested permission', async () => {
      roleRepository.getUserWithRole.mockResolvedValue({
        ...mockUser,
        role: { ...mockRole, permissions: ['read:users'] },
      });

      const result = await service.hasPermission('user-id-1', 'delete:users');

      expect(roleRepository.getUserWithRole).toHaveBeenCalledWith('user-id-1');
      expect(result).toBe(false);
    });

    it('should return true if user has Super Admin role', async () => {
      roleRepository.getUserWithRole.mockResolvedValue({
        ...mockUser,
        role: { ...mockRole, name: 'Super Admin', permissions: ['*'] },
      });

      const result = await service.hasPermission('user-id-1', 'any:permission');

      expect(roleRepository.getUserWithRole).toHaveBeenCalledWith('user-id-1');
      expect(result).toBe(true);
    });

    it('should return false if user has no role', async () => {
      roleRepository.getUserWithRole.mockResolvedValue({
        ...mockUser,
        role: null,
      });

      const result = await service.hasPermission('user-id-1', 'read:users');

      expect(roleRepository.getUserWithRole).toHaveBeenCalledWith('user-id-1');
      expect(result).toBe(false);
    });
  });

  describe('initializeRoles', () => {
    beforeEach(() => {
      // Mock the private methods that are called by initializeRoles
      jest
        .spyOn(service as any, 'createRoleIfNotExists')
        .mockResolvedValue(undefined);
    });

    it('should call createRoleIfNotExists for each default role', async () => {
      await service.initializeRoles();

      // There are 4 default roles in the implementation
      expect((service as any).createRoleIfNotExists).toHaveBeenCalledTimes(4);
    });
  });
});
