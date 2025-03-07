// src/roles/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from '../providers/role.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private rolesService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      this.logger.warn('Access denied: No authenticated user found');
      throw new ForbiddenException('Access denied');
    }

    const userWithRole = await this.rolesService.getUserWithRole(user.userId);
    if (!userWithRole || !userWithRole.role) {
      this.logger.warn(`User ${user.userId} has no assigned role`);
      throw new ForbiddenException('No role assigned to this user');
    }

    const role = userWithRole.role as any;

    // Super Admin can access everything
    if (role.name === 'Super Admin') {
      return true;
    }

    const hasRequiredRole = requiredRoles.includes(role.name);
    if (!hasRequiredRole) {
      this.logger.warn(
        `User ${user.userId} with role ${role.name} attempted to access route requiring roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException('Insufficient role permissions');
    }

    return true;
  }
}
