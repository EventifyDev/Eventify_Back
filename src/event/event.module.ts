import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventService } from './providers/event.service';
import { EventSchema } from './schemas/event.schema';
import { EventController } from './controllers/event.controller';
import { EventRepository } from './repositories/event.repository';
import { UploadModule } from '../upload/upload.module';
import { ParticipantModule } from '../participant/participant.module';
import { NotificationModule } from '@/notifications/notification.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    UploadModule,
    forwardRef(() => ParticipantModule),
    NotificationModule,
  ],
  controllers: [EventController],
  providers: [EventService, EventRepository],
  exports: [EventService],
})
export class EventModule {}
