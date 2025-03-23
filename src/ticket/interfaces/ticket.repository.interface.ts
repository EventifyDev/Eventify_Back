import { Ticket } from '../schemas/ticket.schema';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';

export interface ITicketRepository {
  create(createTicketDto: CreateTicketDto): Promise<Ticket>;
  findAll(): Promise<Ticket[]>;
  findById(id: string): Promise<Ticket>;
  findByEventId(eventId: string): Promise<Ticket[]>;
  update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket>;
  delete(id: string): Promise<boolean>;
  findAvailableTicketsForEvent(eventId: string): Promise<Ticket[]>;
  updateTicketStatus(id: string, status: string): Promise<Ticket>;
  assignTicketToUser(id: string, userId: string): Promise<Ticket>;
}
