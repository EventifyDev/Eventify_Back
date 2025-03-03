import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor() {
    super();
    this.logger.log('JwtAuthGuard initialized');
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      this.logger.warn(
        `JWT authentication failed: ${info?.message || 'Unknown error'}`,
      );
      throw err || new UnauthorizedException('Authentication required');
    }
    this.logger.debug('JWT authentication successful');
    return user;
  }
}
