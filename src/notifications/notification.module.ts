import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './providers/notification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationGateway } from './gateway/notification.gateway';
import { RolesModule } from '../roles/roles.module';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { UserModule } from '../user/user.module';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    forwardRef(() => RolesModule),
    forwardRef(() => UserModule),
    forwardRef(() => EventModule),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationGateway,
    WsJwtGuard,
  ],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
