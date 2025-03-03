import { PartialType } from '@nestjs/swagger';
import { CreateEventDto, EventType } from './create-event.dto';
import { EventStatus } from '../../utils/constants';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  status?: EventStatus;
  processedBy?: string;
  statusUpdatedAt?: Date;
  rejectionReason?: string;
  eventType?: EventType;
}
