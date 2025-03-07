import { Role } from '../schemas/role.schema';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { User } from '../../user/schemas/user.schema';

export interface IRoleService {
  findAll(): Promise<Role[]>;
  findOne(id: string): Promise<Role>;
  findByName(name: string): Promise<Role>;
  create(createRoleDto: CreateRoleDto): Promise<Role>;
  update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role>;
  remove(id: string): Promise<void>;
  assignRoleToUser(userId: string, roleId: string): Promise<any>;
  getUserWithRole(userId: string): Promise<User>;
  hasPermission(userId: string, permission: string): Promise<boolean>;
  initializeRoles(): Promise<void>;
}
