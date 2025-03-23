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
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const createdTicket = new this.ticketModel(createTicketDto);
    return createdTicket.save();
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketModel.find().exec();
  }

  async findById(id: string): Promise<Ticket> {
    return this.ticketModel.findById(id).exec();
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    return this.ticketModel.find({ event: eventId }).exec();
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    return this.ticketModel
      .findByIdAndUpdate(id, updateTicketDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ticketModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findAvailableTicketsForEvent(eventId: string): Promise<Ticket[]> {
    return this.ticketModel
      .find({
        event: eventId,
        status: TicketStatus.AVAILABLE,
        $expr: { $lt: ['$soldQuantity', '$quantity'] },
      })
      .exec();
  }

  async updateTicketStatus(id: string, status: string): Promise<Ticket> {
    return this.ticketModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async assignTicketToUser(id: string, userId: string): Promise<Ticket> {
    return this.ticketModel
      .findByIdAndUpdate(
        id,
        {
          owner: userId,
          status: TicketStatus.SOLD,
          soldAt: new Date(),
          $inc: { soldQuantity: 1 },
        },
        { new: true },
      )
      .exec();
  }
}
