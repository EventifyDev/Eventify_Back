import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { APP_FILTER } from '@nestjs/core';
import { ErrorHandlingMiddleware } from './common/middlewares/error-handling.middleware';
import { JwtAuthMiddleware } from './common/middlewares/jwt-auth.middleware';
import { EventModule } from './event/event.module';
import { UploadModule } from './upload/upload.module';
import { ParticipantModule } from './participant/participant.module';
import { CategoryModule } from './categories/category.module';
import { RolesModule } from './roles/roles.module';
import { NotificationModule } from './notifications/notification.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UserModule,
    ProfileModule,
    AuthModule,
    EventModule,
    UploadModule,
    ParticipantModule,
    CategoryModule,
    RolesModule,
    NotificationModule,
    TicketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ErrorHandlingMiddleware,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtAuthMiddleware)
      .exclude(
        'auth/login',
        'auth/register',
        'auth/verify-otp',
        'auth/resend-otp',
        '/auth/verify-device',
        'auth/google',
        'auth/google/callback',
      )
      .forRoutes('*');
  }
}
