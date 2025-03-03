import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshAuthGuard.name);

  constructor() {
    super();
    this.logger.log('JwtRefreshAuthGuard initialized');
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      this.logger.warn(
        `Refresh token validation failed: ${info?.message || 'Unknown error'}`,
      );
      throw err || new UnauthorizedException('Invalid refresh token');
    }
    this.logger.debug('Refresh token validation successful');
    return user;
  }
}
