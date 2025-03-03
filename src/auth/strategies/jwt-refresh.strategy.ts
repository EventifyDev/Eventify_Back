import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { AuthService } from '../providers/auth.service';

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
          return request?.cookies?.Refresh;
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

    const refreshToken = req.cookies?.Refresh;

    if (!refreshToken) {
      this.logger.warn('No refresh token found in cookies');
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      const user = await this.authService.verifyUserRefreshToken(
        refreshToken,
        payload.userId,
      );
      this.logger.debug(
        `Refresh token validated for userId: ${payload.userId}`,
      );
      return user;
    } catch (error) {
      this.logger.error(`Refresh token validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
