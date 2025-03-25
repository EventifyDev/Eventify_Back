import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ITicketService } from '../interfaces/ticket.service.interface';
import { TicketRepository } from '../repositories/ticket.repository';
import { TicketDocument } from '../schemas/ticket.schema';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { PurchaseTicketDto } from '../dtos/purchase-ticket.dto';
import { TicketStatus } from '../enums/ticket-status.enum';

@Injectable()
export class TicketService implements ITicketService {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async createTicket(
    createTicketDto: CreateTicketDto,
  ): Promise<TicketDocument> {
    return this.ticketRepository.create(createTicketDto);
  }

  async getAllTickets(): Promise<TicketDocument[]> {
    return this.ticketRepository.findAll();
  }

  async getTicketById(id: string): Promise<TicketDocument> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return ticket;
  }

  async getTicketsByEventId(eventId: string): Promise<TicketDocument[]> {
    return this.ticketRepository.findByEventId(eventId);
  }

  async updateTicket(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<TicketDocument> {
    return this.ticketRepository.update(id, updateTicketDto);
  }

  async deleteTicket(id: string): Promise<boolean> {
    const ticket = await this.getTicketById(id);
    if (ticket.status === TicketStatus.SOLD) {
      throw new BadRequestException('Cannot delete a sold ticket');
    }
    return this.ticketRepository.delete(id);
  }

  async purchaseTicket(
    purchaseTicketDto: PurchaseTicketDto,
  ): Promise<TicketDocument> {
    const { ticketId, quantity = 1 } = purchaseTicketDto;
    const ticket = await this.getTicketById(ticketId);

    if (ticket.status !== TicketStatus.AVAILABLE) {
      throw new BadRequestException('Ticket is not available for purchase');
    }

    if (ticket.soldQuantity + quantity > ticket.quantity) {
      throw new BadRequestException('Not enough tickets available');
    }

    const updatedTicket = await this.ticketRepository.updateTicketStatus(
      ticketId,
      TicketStatus.SOLD,
    );

    return updatedTicket;
  }

  async getAvailableTicketsForEvent(
    eventId: string,
  ): Promise<TicketDocument[]> {
    return this.ticketRepository.findAvailableTicketsForEvent(eventId);
  }
}
