import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParticipantService } from './providers/participant.service';
import { ParticipantController } from './controllers/participant.controller';
import { ParticipantRepository } from './repositories/participant.repository';
import { Participant, ParticipantSchema } from './schemas/participant.schema';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Participant.name, schema: ParticipantSchema },
    ]),
    forwardRef(() => EventModule),
  ],
  controllers: [ParticipantController],
  providers: [
    ParticipantService,
    ParticipantRepository,
    {
      provide: 'IParticipantRepository',
      useClass: ParticipantRepository,
    },
  ],
  exports: [ParticipantService],
})
export class ParticipantModule {}
