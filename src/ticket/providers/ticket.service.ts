import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ITicketService } from '../interfaces/ticket.service.interface';
import { TicketRepository } from '../repositories/ticket.repository';
import { Ticket } from '../schemas/ticket.schema';
// import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { PurchaseTicketDto } from '../dtos/purchase-ticket.dto';
import { TicketStatus } from '../enums/ticket-status.enum';
// import * as QRCode from 'qrcode';

@Injectable()
export class TicketService implements ITicketService {
  constructor(private readonly ticketRepository: TicketRepository) {}

  // async createTicket(createTicketDto: CreateTicketDto): Promise<Ticket> {
  //   const newTicket = await this.ticketRepository.create(createTicketDto);
  //   // Generate QR code after creating ticket
  //   const qrCode = await this.generateQRCode(newTicket._id);
  //   return this.ticketRepository.update(newTicket._id, {
  //     qrCode,
  //   } as UpdateTicketDto);
  // }

  async getAllTickets(): Promise<Ticket[]> {
    return this.ticketRepository.findAll();
  }

  async getTicketById(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return ticket;
  }

  async getTicketsByEventId(eventId: string): Promise<Ticket[]> {
    return this.ticketRepository.findByEventId(eventId);
  }

  async updateTicket(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.getTicketById(id);

    // If status is being changed to SOLD, ensure owner exists
    if (updateTicketDto.status === TicketStatus.SOLD && !ticket.owner) {
      throw new BadRequestException(
        'Cannot mark ticket as SOLD without an owner',
      );
    }

    return this.ticketRepository.update(id, updateTicketDto);
  }

  async deleteTicket(id: string): Promise<boolean> {
    const ticket = await this.getTicketById(id);
    if (ticket.status === TicketStatus.SOLD) {
      throw new BadRequestException('Cannot delete a sold ticket');
    }
    return this.ticketRepository.delete(id);
  }

  async purchaseTicket(purchaseTicketDto: PurchaseTicketDto): Promise<Ticket> {
    const { ticketId, userId, quantity = 1 } = purchaseTicketDto;

    const ticket = await this.getTicketById(ticketId);

    if (ticket.status !== TicketStatus.AVAILABLE) {
      throw new BadRequestException('Ticket is not available for purchase');
    }

    if (ticket.soldQuantity + quantity > ticket.quantity) {
      throw new BadRequestException('Not enough tickets available');
    }

    // This is a placeholder for future payment integration
    // In a real implementation, you would process the payment here
    // and only update the ticket status after successful payment

    // For now, we'll just update the ticket
    const updatedTicket = await this.ticketRepository.assignTicketToUser(
      ticketId,
      userId,
    );

    // If this was the last available ticket, update status
    if (updatedTicket.soldQuantity >= updatedTicket.quantity) {
      await this.ticketRepository.updateTicketStatus(
        ticketId,
        TicketStatus.SOLD,
      );
    }

    return updatedTicket;
  }

  async getAvailableTicketsForEvent(eventId: string): Promise<Ticket[]> {
    return this.ticketRepository.findAvailableTicketsForEvent(eventId);
  }

  // async generateQRCode(ticketId: string): Promise<string> {
  //   const ticket = await this.getTicketById(ticketId);

  //   // Create a data object that will be encoded in the QR code
  //   const qrData = {
  //     ticketId: ticket._id,
  //     eventId: ticket.event,
  //     type: ticket.type,
  //     timestamp: new Date().toISOString(),
  //   };

  //   // Convert the data to a string and generate QR code
  //   const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
  //   return qrCodeDataUrl;
  // }
}
