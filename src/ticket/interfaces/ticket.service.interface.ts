import { Ticket } from '../schemas/ticket.schema';
// import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { PurchaseTicketDto } from '../dtos/purchase-ticket.dto';

export interface ITicketService {
  // createTicket(createTicketDto: CreateTicketDto): Promise<Ticket>;
  getAllTickets(): Promise<Ticket[]>;
  getTicketById(id: string): Promise<Ticket>;
  getTicketsByEventId(eventId: string): Promise<Ticket[]>;
  updateTicket(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket>;
  deleteTicket(id: string): Promise<boolean>;
  purchaseTicket(purchaseTicketDto: PurchaseTicketDto): Promise<Ticket>;
  getAvailableTicketsForEvent(eventId: string): Promise<Ticket[]>;
  // generateQRCode(ticketId: string): Promise<string>;
}
