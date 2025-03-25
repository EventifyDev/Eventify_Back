import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IEventRepository } from '../interfaces/event.repository.interface';
import { Event, EventDocument } from '../schemas/event.schema';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';

@Injectable()
export class EventRepository implements IEventRepository {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
  ) {}

  async findAll(): Promise<EventDocument[]> {
    return this.eventModel.find({ isApproved: true }).exec();
  }

  async findById(id: string): Promise<EventDocument | null> {
    return this.eventModel.findById(id).exec();
  }

  async findPendingEvents(): Promise<EventDocument[]> {
    return this.eventModel
      .find({
        isApproved: false,
        rejectionReason: { $exists: false },
      })
      .exec();
  }

  async updateApprovalStatus(
    id: string,
    approvalData: {
      isApproved: boolean;
      reviewedBy: Types.ObjectId;
      rejectionReason?: string;
    },
  ): Promise<EventDocument | null> {
    return this.eventModel
      .findByIdAndUpdate(id, approvalData, { new: true })
      .exec();
  }

  async findByOrganizerId(organizerId: string): Promise<EventDocument[]> {
    return this.eventModel.find({ organizer: organizerId }).exec();
  }

  async create(createEventDto: CreateEventDto): Promise<EventDocument> {
    const createdEvent = new this.eventModel(createEventDto);
    return createdEvent.save();
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventDocument | null> {
    return this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<EventDocument | null> {
    return this.eventModel.findByIdAndDelete(id).exec();
  }

  async search(query: string): Promise<SearchEventResponseDto[]> {
    const events = await this.eventModel
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
      .select({
        _id: 1,
        name: 1,
        description: 1,
        date: 1,
        location: 1,
        eventType: 1,
        image: 1,
      })
      .populate('organizer', 'username email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return events.map((event) => ({
      ...event,
      id: event._id.toString(),
    })) as SearchEventResponseDto[];
  }
}
