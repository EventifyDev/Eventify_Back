import { Event } from '../schemas/event.schema';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';
import { EventStatus } from '../../utils/constants';

export interface IEventService {
  findAllEvents(
    page?: number,
    limit?: number,
  ): Promise<{
    events: Event[];
    total: number;
    currentPage: number;
    totalPages: number;
  }>;
  findAllByOrganizer(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<Event[]>;
  findUpcomingEvents(limit?: number): Promise<Event[]>;
  findPopularEvents(limit?: number): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  create(
    createEventDto: CreateEventDto,
    organizerId: string,
    image?: Express.Multer.File,
  ): Promise<Event>;
  update(id: string, updateEventDto: UpdateEventDto): Promise<Event | null>;
  delete(id: string): Promise<boolean>;
  findByOrganizerId(organizerId: string): Promise<Event[]>;
  search(
    query: string,
    page?: number,
    limit?: number,
  ): Promise<{
    events: SearchEventResponseDto[];
    total: number;
    currentPage: number;
    totalPages: number;
  }>;
  updateStatus(
    id: string,
    status: EventStatus,
    adminId: string,
    rejectionReason?: string,
  ): Promise<Event>;
}
