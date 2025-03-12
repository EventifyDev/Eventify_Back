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
      state: true,
    });
    this.logger.log('GoogleStrategy initialized');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    let role = 'Participant';

    if (profile._json.state) {
      try {
        const stateData = JSON.parse(
          Buffer.from(profile._json.state, 'base64').toString(),
        );
        if (
          stateData.role &&
          ['Organizer', 'Participant'].includes(stateData.role)
        ) {
          role = stateData.role;
        }
      } catch (error) {
        this.logger.error(`Failed to parse state data: ${error.message}`);
      }
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
