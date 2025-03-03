import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IEventRepository } from '../interfaces/event.repository.interface';
import { Event } from '../schemas/event.schema';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';

@Injectable()
export class EventRepository implements IEventRepository {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
  ) {}

  async findAll(userId: string, page = 1, limit = 10): Promise<Event[]> {
    const skip = (page - 1) * limit;
    return (await this.eventModel
      .find({ organizer: userId })
      .populate('organizer', 'username email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec()) as Event[];
  }

  async findById(id: string): Promise<Event | null> {
    const event = await this.eventModel
      .findById(id)
      .populate('organizer', 'username email')
      .lean()
      .exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event as Event;
  }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const createdEvent = new this.eventModel(createEventDto);
    return createdEvent.save();
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<Event | null> {
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(
        id,
        {
          ...updateEventDto,
        },
        { new: true },
      )
      .populate('organizer', 'username email')
      .lean()
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException('Event not found');
    }

    return updatedEvent as Event;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.eventModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Event not found');
    }
    return true;
  }

  async findByOrganizerId(organizerId: string): Promise<Event[]> {
    return (await this.eventModel
      .find({ organizer: organizerId })
      .populate('organizer', 'username email')
      .sort({ createdAt: -1 })
      .lean()
      .exec()) as Event[];
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
