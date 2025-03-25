import { TicketDocument } from '../schemas/ticket.schema';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { PurchaseTicketDto } from '../dtos/purchase-ticket.dto';

export interface ITicketService {
  createTicket(createTicketDto: CreateTicketDto): Promise<TicketDocument>;
  getAllTickets(): Promise<TicketDocument[]>;
  getTicketById(id: string): Promise<TicketDocument>;
  getTicketsByEventId(eventId: string): Promise<TicketDocument[]>;
  updateTicket(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<TicketDocument>;
  deleteTicket(id: string): Promise<boolean>;
  purchaseTicket(purchaseTicketDto: PurchaseTicketDto): Promise<TicketDocument>;
  getAvailableTicketsForEvent(eventId: string): Promise<TicketDocument[]>;
}
