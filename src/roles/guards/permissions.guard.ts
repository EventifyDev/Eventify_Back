import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from '../providers/role.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      this.logger.warn('Access denied: No authenticated user found');
      throw new ForbiddenException('Access denied');
    }

    // For Super Admins with wildcard permissions
    const userWithRole = await this.rolesService.getUserWithRole(user.userId);
    if (userWithRole?.role) {
      const role = userWithRole.role as any;
      if (role.name === 'Super Admin' || role.permissions.includes('*')) {
        return true;
      }
    }

    // Check if user has all required permissions
    for (const permission of requiredPermissions) {
      if (!user.permissions.includes(permission)) {
        this.logger.warn(
          `Access denied: User ${user.userId} lacks permission "${permission}"`,
        );
        throw new ForbiddenException(
          `Access denied: Missing required permission: ${permission}`,
        );
      }
    }

    return true;
  }
}
