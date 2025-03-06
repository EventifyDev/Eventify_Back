import { Role } from '../schemas/role.schema';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

export interface IRoleService {
  findAll(): Promise<Role[]>;
  findOne(id: string): Promise<Role>;
  findByName(name: string): Promise<Role>;
  create(createRoleDto: CreateRoleDto): Promise<Role>;
  update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role>;
  remove(id: string): Promise<void>;
  assignRoleToUser(userId: string, roleId: string): Promise<any>;
  hasPermission(userId: string, permission: string): Promise<boolean>;
  initializeRoles(): Promise<void>;
}
