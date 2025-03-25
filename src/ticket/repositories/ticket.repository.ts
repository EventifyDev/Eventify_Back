import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from '../schemas/ticket.schema';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { ITicketRepository } from '../interfaces/ticket.repository.interface';
import { TicketStatus } from '../enums/ticket-status.enum';

@Injectable()
export class TicketRepository implements ITicketRepository {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<Ticket>,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<TicketDocument> {
    const createdTicket = new this.ticketModel(createTicketDto);
    return createdTicket.save();
  }

  async findAll(): Promise<TicketDocument[]> {
    return this.ticketModel.find().exec();
  }

  async findById(id: string): Promise<TicketDocument | null> {
    return this.ticketModel.findById(id).exec();
  }

  async findByEventId(eventId: string): Promise<TicketDocument[]> {
    return this.ticketModel.find({ event: eventId }).exec();
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<TicketDocument | null> {
    return this.ticketModel
      .findByIdAndUpdate(id, updateTicketDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ticketModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findAvailableTicketsForEvent(
    eventId: string,
  ): Promise<TicketDocument[]> {
    return this.ticketModel
      .find({
        event: eventId,
        status: TicketStatus.AVAILABLE,
        soldQuantity: { $lt: '$quantity' },
      })
      .exec();
  }

  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
  ): Promise<TicketDocument | null> {
    return this.ticketModel
      .findByIdAndUpdate(ticketId, { status }, { new: true })
      .exec();
  }

  async assignTicketToUser(
    ticketId: string,
    userId: string,
  ): Promise<TicketDocument | null> {
    return this.ticketModel
      .findByIdAndUpdate(
        ticketId,
        {
          $inc: { soldQuantity: 1 },
          $set: { owner: userId },
        },
        { new: true },
      )
      .exec();
  }
}
