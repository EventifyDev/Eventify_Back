import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventRepository } from '../repositories/event.repository';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { Event } from '../schemas/event.schema';
import { IEventService } from '../interfaces/event.interface';
import { UploadService } from '../../upload/providers/upload.service';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';
import {
  EventCreationException,
  EventNotFoundException,
  ImageUploadException,
} from '../exceptions/event.exception';
import { EventStatus } from '../../utils/constants';

@Injectable()
export class EventService implements IEventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly uploadService: UploadService,
  ) {}

  async findAllEvents(page?: number, limit?: number) {
    try {
      return this.eventRepository.findAllEvents(page, limit);
    } catch (error) {
      this.logger.error('Error finding all events:', error);
      throw error;
    }
  }

  async findAllByOrganizer(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<Event[]> {
    try {
      return this.eventRepository.findAllByOrganizer(userId, page, limit);
    } catch (error) {
      this.logger.error('Error finding all events by organizer:', error);
      throw error;
    }
  }

  async findUpcomingEvents(limit?: number): Promise<Event[]> {
    try {
      return this.eventRepository.findUpcomingEvents(limit);
    } catch (error) {
      this.logger.error('Error finding upcoming events:', error);
      throw error;
    }
  }

  async findPopularEvents(limit?: number): Promise<Event[]> {
    try {
      return this.eventRepository.findPopularEvents(limit);
    } catch (error) {
      this.logger.error('Error finding popular events:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Event> {
    try {
      return this.eventRepository.findById(id);
    } catch (error) {
      this.logger.error('Error finding event by ID:', error);
      throw error;
    }
  }

  private async handleImageUpload(
    image: Express.Multer.File | string | undefined,
  ): Promise<string> {
    try {
      if (!image) {
        throw new ImageUploadException();
      }

      if (image instanceof Buffer || typeof image === 'object') {
        const uploadResult = await this.uploadService.uploadFile(
          image as Express.Multer.File,
        );
        return uploadResult.url;
      }

      if (typeof image === 'string' && image.startsWith('data:image')) {
        const buffer = Buffer.from(
          image.replace(/^data:image\/\w+;base64,/, ''),
          'base64',
        );
        const mimeType = image.split(';')[0].split(':')[1];

        const uploadResult = await this.uploadService.uploadFile({
          buffer,
          mimetype: mimeType,
          originalname: `image-${Date.now()}.${mimeType.split('/')[1]}`,
        } as Express.Multer.File);

        return uploadResult.url;
      }

      throw new ImageUploadException();
    } catch (error) {
      this.logger.error('Failed to upload image', error);
      throw new ImageUploadException();
    }
  }

  async create(
    createEventDto: CreateEventDto,
    organizerId: string,
    image?: Express.Multer.File,
  ): Promise<Event> {
    try {
      const imageUrl = await this.handleImageUpload(image);

      const eventData = {
        ...createEventDto,
        organizer: organizerId,
        image: imageUrl,
        status: EventStatus.PENDING,
      };

      const createdEvent = await this.eventRepository.create(eventData);
      return createdEvent;
    } catch (error) {
      this.logger.error('Error creating event:', error);
      if (error instanceof ImageUploadException) {
        throw error;
      }
      throw new EventCreationException(
        `Failed to create event: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    image?: Express.Multer.File,
  ): Promise<Event> {
    try {
      const existingEvent = await this.eventRepository.findById(id);

      let imageUrl = existingEvent.image;
      if (image || updateEventDto.image) {
        imageUrl = await this.handleImageUpload(image || updateEventDto.image);
      }

      if (updateEventDto.date) {
        updateEventDto.date = new Date(updateEventDto.date);
      }

      const updatedEventData = {
        ...updateEventDto,
        image: imageUrl,
      };

      return this.eventRepository.update(id, updatedEventData);
    } catch (error) {
      this.logger.error('Error updating event:', error);
      if (
        error instanceof EventNotFoundException ||
        error instanceof ImageUploadException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update event');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return this.eventRepository.delete(id);
    } catch (error) {
      this.logger.error('Error deleting event:', error);
      if (error instanceof EventNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete event');
    }
  }

  async findByOrganizerId(organizerId: string): Promise<Event[]> {
    try {
      return this.eventRepository.findByOrganizerId(organizerId);
    } catch (error) {
      this.logger.error('Error finding events by organizer ID:', error);
      throw error;
    }
  }

  async search(
    query: string,
    page?: number,
    limit?: number,
  ): Promise<{
    events: SearchEventResponseDto[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    try {
      return this.eventRepository.search(query, page, limit);
    } catch (error) {
      this.logger.error('Error searching events:', error);
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: EventStatus,
    adminId: string,
    rejectionReason?: string,
  ): Promise<Event> {
    try {
      const event = await this.eventRepository.findById(id);

      if (!event) {
        throw new EventNotFoundException(id);
      }

      const updateData = {
        status,
        processedBy: adminId,
        statusUpdatedAt: new Date(),
        ...(status === EventStatus.REJECTED && { rejectionReason }),
      };

      return this.eventRepository.update(id, updateData);
    } catch (error) {
      this.logger.error(`Error updating event status: ${error.message}`);
      if (error instanceof EventNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update event status');
    }
  }
}
