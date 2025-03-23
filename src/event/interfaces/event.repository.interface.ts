import { Event, EventDocument } from '../schemas/event.schema';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';

export interface IEventRepository {
  findAll(): Promise<Event[]>;
  findByOrganizerId(userId: string): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  create(createEventDto: CreateEventDto): Promise<Event>;
  update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventDocument | null>;
  delete(id: string): Promise<EventDocument | null>;
  findByOrganizerId(organizerId: string): Promise<EventDocument[]>;
  search(query: string): Promise<SearchEventResponseDto[]>;
}
