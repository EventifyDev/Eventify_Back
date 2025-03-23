import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      passReqToCallback: true,
      state: false,
      accessType: 'offline',
      prompt: 'consent',
    });
    this.logger.log('GoogleStrategy initialized');
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    let role = 'Participant';

    try {
      const state = JSON.parse(
        Buffer.from(req.query.state.toString(), 'base64').toString(),
      );
      role = state?.role || role;
    } catch (error) {
      this.logger.error('Error parsing state:', error.message);
    }

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      role: role,
      accessToken,
      refreshToken,
    };

    this.logger.debug(`Google profile validated for email: ${user.email}`);
    done(null, user);
  }
}
