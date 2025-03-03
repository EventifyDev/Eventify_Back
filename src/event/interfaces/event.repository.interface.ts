import { Event } from '../schemas/event.schema';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';
export interface IEventRepository {
  findAll(userId: string, page?: number, limit?: number): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  create(createEventDto: CreateEventDto): Promise<Event>;
  update(id: string, updateEventDto: UpdateEventDto): Promise<Event | null>;
  delete(id: string): Promise<boolean>;
  findByOrganizerId(organizerId: string): Promise<Event[]>;
  search(query: string): Promise<SearchEventResponseDto[]>;
}
