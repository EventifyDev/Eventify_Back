import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '@/auth/strategies/jwt-refresh.strategy';
import { GoogleStrategy } from '@/auth/strategies/google.strategy';
import { UserModule } from '@/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '@/auth/controllers/auth.controller';
import { EmailService } from '@/auth/providers/email.service';
import { MailerConfig } from '@/config/mailer.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesModule } from '@/roles/roles.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: `${configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_MS')}ms`,
          algorithm: 'HS256',
        },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => RolesModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    EmailService,
    MailerConfig,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
