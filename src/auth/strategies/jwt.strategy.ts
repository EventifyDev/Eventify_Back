import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/providers/user.service';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
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

      this.logger.debug(`User validated for userId: ${payload.userId}`);
      return { _id: user._id, email: user.email };
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
