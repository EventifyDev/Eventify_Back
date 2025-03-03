import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../providers/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
    this.logger.log('LocalStrategy initialized');
  }

  async validate(email: string, password: string): Promise<any> {
    this.logger.debug(`Attempting to validate user with email: ${email}`);
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`User with email: ${email} successfully validated`);
    return user;
  }
}
