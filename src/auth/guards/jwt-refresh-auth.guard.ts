import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, lastValueFrom } from 'rxjs';
import { AuthService } from '../providers/auth.service';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Check cookies, headers and request body
    const refreshToken =
      request.cookies?.Refresh ||
      this.extractTokenFromHeader(request) ||
      request.body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    // Store the token in request for later use
    request.refreshToken = refreshToken;

    if (await this.authService.isRefreshTokenBlacklisted(refreshToken)) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const result = super.canActivate(context);

    if (typeof result === 'boolean') {
      return result;
    }

    if (result instanceof Observable) {
      return await lastValueFrom(result);
    }

    return await result;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
