import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { AuthService } from '../providers/auth.service';

declare module 'express' {
  interface Request {
    refreshToken?: string;
  }
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // First try to get from cookies
          const cookieToken = request?.cookies?.Refresh;
          if (cookieToken) return cookieToken;

          // Then try authorization header
          const authHeader = request.headers.authorization;
          if (authHeader) {
            const [type, token] = authHeader.split(' ');
            if (type === 'Bearer') return token;
          }

          // Finally check in request body
          const bodyToken = request.body?.refreshToken;
          if (bodyToken) return bodyToken;

          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
    this.logger.log('JwtRefreshStrategy initialized');
  }

  async validate(req: Request, payload: TokenPayload) {
    this.logger.debug(`Validating refresh token for userId: ${payload.userId}`);

    const refreshToken =
      req.cookies?.Refresh ||
      this.extractTokenFromHeader(req) ||
      req.body?.refreshToken ||
      (req as any).refreshToken;

    this.logger.debug(`Received cookies: ${JSON.stringify(req.cookies)}`);
    if (refreshToken) {
      this.logger.debug('Found refresh token in request');
    }

    if (!refreshToken) {
      this.logger.error('Refresh token missing in cookies, headers and body');
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const user = await this.authService.verifyUserRefreshToken(
        refreshToken,
        payload.userId,
      );

      if (!user) {
        this.logger.error(`User not found for userId: ${payload.userId}`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.debug(`Refresh token validated for user: ${user.email}`);
      return {
        userId: user._id.toString(),
        email: user.email,
        role: payload.role,
        permissions: payload.permissions,
      };
    } catch (error) {
      this.logger.error(`Refresh token validation failed: ${error.stack}`);
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
