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

  // Nouvelle méthode pour récupérer tous les événements
  async findAllEvents(
    page = 1,
    limit = 9,
  ): Promise<{
    events: Event[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const total = await this.eventModel.countDocuments();

    const events = await this.eventModel
      .find()
      .populate('organizer', 'username email')
      .skip(skip)
      .limit(limit)
      .sort({ date: 1 })
      .lean()
      .exec();

    return {
      events: events as Event[],
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllByOrganizer(
    userId: string,
    page = 1,
    limit = 9,
  ): Promise<Event[]> {
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

  // Méthode pour récupérer les événements à venir
  async findUpcomingEvents(limit = 6): Promise<Event[]> {
    const now = new Date();
    return (await this.eventModel
      .find({ date: { $gte: now } })
      .populate('organizer', 'username email')
      .limit(limit)
      .sort({ date: 1 })
      .lean()
      .exec()) as Event[];
  }

  // Méthode pour récupérer les événements populaires
  async findPopularEvents(limit = 6): Promise<Event[]> {
    return (await this.eventModel
      .find()
      .populate('organizer', 'username email')
      .limit(limit)
      .sort({ views: -1, date: 1 })
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

  async search(
    query: string,
    page = 1,
    limit = 10,
  ): Promise<{
    events: SearchEventResponseDto[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const total = await this.eventModel.countDocuments({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    });

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
        organizer: 1,
      })
      .populate('organizer', 'username email')
      .skip(skip)
      .limit(limit)
      .sort({ date: 1 })
      .lean()
      .exec();

    return {
      events: events.map((event) => ({
        ...event,
        id: event._id.toString(),
        eventType: event.eventType,
      })) as SearchEventResponseDto[],
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
