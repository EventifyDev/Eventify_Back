import { EventDocument } from '../schemas/event.schema';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';

export interface IEventService {
  findAll(page?: number, limit?: number): Promise<EventDocument[]>;
  findById(id: string): Promise<EventDocument>;
  findByUserId(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<EventDocument[]>;
  findByOrganizerId(organizerId: string): Promise<EventDocument[]>;
  getPendingEvents(): Promise<EventDocument[]>;
  approveEvent(eventId: string, adminId: string): Promise<EventDocument>;
  rejectEvent(
    eventId: string,
    adminId: string,
    reason: string,
  ): Promise<EventDocument>;
  create(
    createEventDto: CreateEventDto,
    organizerId: string,
    image?: Express.Multer.File,
  ): Promise<EventDocument>;
  update(id: string, updateEventDto: UpdateEventDto): Promise<EventDocument>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<SearchEventResponseDto[]>;
}
