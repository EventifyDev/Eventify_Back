import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RoleService } from '../providers/role.service';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { NotFoundException } from '@nestjs/common';

describe('RolesController', () => {
  let controller: RolesController;
  let roleService: RoleService;

  const mockRole = {
    _id: 'role-id-1',
    name: 'Test Role',
    permissions: ['read:users', 'write:users'],
    description: 'A test role',
  };

  const mockRoles = [
    mockRole,
    {
      _id: 'role-id-2',
      name: 'Admin Role',
      permissions: ['manage:all'],
      description: 'An admin role',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RoleService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            assignRoleToUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    roleService = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Test Role',
        permissions: ['read:users', 'write:users'],
        description: 'A test role',
      };

      jest.spyOn(roleService, 'create').mockResolvedValue(mockRole as any);

      const result = await controller.create(createRoleDto);

      expect(roleService.create).toHaveBeenCalledWith(createRoleDto);
      expect(result).toEqual(mockRole);
    });
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      jest.spyOn(roleService, 'findAll').mockResolvedValue(mockRoles as any);

      const result = await controller.findAll();

      expect(roleService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockRoles);
    });
  });

  describe('findOne', () => {
    it('should return a single role by id', async () => {
      jest.spyOn(roleService, 'findOne').mockResolvedValue(mockRole as any);

      const result = await controller.findOne('role-id-1');

      expect(roleService.findOne).toHaveBeenCalledWith('role-id-1');
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      jest
        .spyOn(roleService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const updateRoleDto: UpdateRoleDto = {
        permissions: ['read:users', 'write:users', 'delete:users'],
        description: 'Updated description',
      };

      const updatedRole = {
        ...mockRole,
        permissions: ['read:users', 'write:users', 'delete:users'],
        description: 'Updated description',
      };

      jest.spyOn(roleService, 'update').mockResolvedValue(updatedRole as any);

      const result = await controller.updateRole('role-id-1', updateRoleDto);

      expect(roleService.update).toHaveBeenCalledWith(
        'role-id-1',
        updateRoleDto,
      );
      expect(result).toEqual(updatedRole);
    });
  });

  describe('remove', () => {
    it('should delete a role', async () => {
      jest
        .spyOn(roleService, 'remove')
        .mockResolvedValue({ acknowledged: true, deletedCount: 1 } as any);

      const result = await controller.remove('role-id-1');

      expect(roleService.remove).toHaveBeenCalledWith('role-id-1');
      expect(result).toEqual({ message: 'Role deleted successfully' });
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign a role to a user', async () => {
      const userId = 'user-id-1';
      const roleId = 'role-id-1';
      const expectedResult = {
        success: true,
        message: 'Role assigned successfully',
      };

      jest
        .spyOn(roleService, 'assignRoleToUser')
        .mockResolvedValue(expectedResult as any);

      const result = await controller.assignRoleToUser(userId, roleId);

      expect(roleService.assignRoleToUser).toHaveBeenCalledWith(userId, roleId);
      expect(result).toEqual(expectedResult);
    });
  });
});
