import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/providers/user.service';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { RoleService } from '../../roles/providers/role.service';
import { Role } from '../../roles/schemas/role.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => RoleService))
    private readonly roleService: RoleService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
    this.logger.log('JwtStrategy initialized');
  }

  async validate(payload: TokenPayload) {
    this.logger.debug(`Validating JWT for userId: ${payload.userId}`);

    try {
      const user = await this.userService.getUser({ _id: payload.userId });

      if (!user) {
        this.logger.warn(`No user found for userId: ${payload.userId}`);
        throw new UnauthorizedException('User not found');
      }

      let role = null;
      let permissions = [];

      // If role info is in payload, use it directly
      if (payload.role) {
        role = payload.role;
        permissions = payload.permissions || [];
        this.logger.debug(`Using role from payload: ${role}`);
      }
      // Otherwise try to get it from database
      else {
        try {
          const userWithRole = await this.roleService.getUserWithRole(
            payload.userId,
          );
          if (userWithRole && userWithRole.role) {
            const roleObj = userWithRole.role as Role;
            role = roleObj.name;
            permissions = roleObj.permissions || [];
            this.logger.debug(`Retrieved role from database: ${role}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to retrieve role: ${error.message}`);
        }
      }

      this.logger.debug(
        `User validated for userId: ${payload.userId} with role: ${role}`,
      );
      return {
        userId: payload.userId,
        email: user.email,
        role,
        permissions,
      };
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
