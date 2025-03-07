import { Role } from '../schemas/role.schema';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';

export interface IRoleRepository {
  findAll(): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  create(createRoleDto: CreateRoleDto): Promise<Role>;
  update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role | null>;
  remove(id: string): Promise<boolean>;
  assignRoleToUser(userId: string, roleId: string): Promise<any>;
  getUserWithRole(userId: string): Promise<any>;
}
