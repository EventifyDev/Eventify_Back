import {
<<<<<<< HEAD
  Injectable,
  InternalServerErrorException,
  Logger,
=======
  BadRequestException,
  Injectable,
  NotFoundException,
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
} from '@nestjs/common';
import { EventRepository } from '../repositories/event.repository';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { Event } from '../schemas/event.schema';
import { IEventService } from '../interfaces/event.interface';
import { UploadService } from '../../upload/providers/upload.service';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';
<<<<<<< HEAD
import {
  EventCreationException,
  EventNotFoundException,
  ImageUploadException,
} from '../exceptions/event.exception';
import { EventStatus } from '../../utils/constants';

@Injectable()
export class EventService implements IEventService {
  private readonly logger = new Logger(EventService.name);

=======

@Injectable()
export class EventService implements IEventService {
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly uploadService: UploadService,
  ) {}

<<<<<<< HEAD
  async findAllEvents(page?: number, limit?: number) {
    try {
      return this.eventRepository.findAllEvents(page, limit);
    } catch (error) {
      this.logger.error('Error finding all events:', error);
      throw error;
    }
  }

  async findAllByOrganizer(
=======
  async findAll(
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<Event[]> {
<<<<<<< HEAD
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
=======
    const events = await this.eventRepository.findAll(userId, page, limit);
    if (!events || events.length === 0) {
      throw new NotFoundException('Events not found');
    }
    return events;
  }

  async findById(id: string): Promise<Event> {
    return this.eventRepository.findById(id);
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
  }

  async create(
    createEventDto: CreateEventDto,
    organizerId: string,
    image?: Express.Multer.File,
  ): Promise<Event> {
    try {
<<<<<<< HEAD
      const imageUrl = await this.handleImageUpload(image);
=======
      let imageUrl: string;

      if (image) {
        const uploadResult = await this.uploadService.uploadFile(image);
        imageUrl = uploadResult.url;
      }
      // Handle base64 image from DTO
      else if (
        createEventDto.image &&
        typeof createEventDto.image === 'string' &&
        createEventDto.image.startsWith('data:image')
      ) {
        const buffer = Buffer.from(
          createEventDto.image.replace(/^data:image\/\w+;base64,/, ''),
          'base64',
        );
        const mimeType = createEventDto.image.split(';')[0].split(':')[1];

        const uploadResult = await this.uploadService.uploadFile({
          buffer,
          mimetype: mimeType,
          originalname: `image-${Date.now()}.${mimeType.split('/')[1]}`,
        } as Express.Multer.File);

        imageUrl = uploadResult.url;
      } else {
        throw new BadRequestException('Image is required');
      }
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1

      const eventData = {
        ...createEventDto,
        organizer: organizerId,
        image: imageUrl,
<<<<<<< HEAD
        status: EventStatus.PENDING,
=======
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
      };

      const createdEvent = await this.eventRepository.create(eventData);
      return createdEvent;
    } catch (error) {
<<<<<<< HEAD
      this.logger.error('Error creating event:', error);
      if (error instanceof ImageUploadException) {
        throw error;
      }
      throw new EventCreationException(
        `Failed to create event: ${error.message}`,
      );
=======
      console.error('Error creating event:', error);
      throw new BadRequestException(`Failed to create event: ${error.message}`);
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
    }
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    image?: Express.Multer.File,
  ): Promise<Event> {
    try {
      const existingEvent = await this.eventRepository.findById(id);
<<<<<<< HEAD

      let imageUrl = existingEvent.image;
      if (image || updateEventDto.image) {
        imageUrl = await this.handleImageUpload(image || updateEventDto.image);
      }

=======
      if (!existingEvent) {
        throw new NotFoundException('Event not found');
      }

      // Handle image update if provided
      if (image) {
        const uploadResult = await this.uploadService.uploadFile(image);
        updateEventDto.image = uploadResult.url;
      }
      // Handle base64 image from DTO
      else if (
        updateEventDto.image &&
        typeof updateEventDto.image === 'string' &&
        updateEventDto.image.startsWith('data:image')
      ) {
        const buffer = Buffer.from(
          updateEventDto.image.replace(/^data:image\/\w+;base64,/, ''),
          'base64',
        );
        const mimeType = updateEventDto.image.split(';')[0].split(':')[1];

        const uploadResult = await this.uploadService.uploadFile({
          buffer,
          mimetype: mimeType,
          originalname: `image-${Date.now()}.${mimeType.split('/')[1]}`,
        } as Express.Multer.File);

        updateEventDto.image = uploadResult.url;
      }

      // Ensure date is properly converted
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
      if (updateEventDto.date) {
        updateEventDto.date = new Date(updateEventDto.date);
      }

<<<<<<< HEAD
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
=======
      return this.eventRepository.update(id, updateEventDto);
    } catch (error) {
      console.error('Error updating event:', error);
      throw new BadRequestException(`Failed to update event: ${error.message}`);
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
    }
  }

  async delete(id: string): Promise<boolean> {
<<<<<<< HEAD
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
=======
    return this.eventRepository.delete(id);
  }

  async findByOrganizerId(organizerId: string): Promise<Event[]> {
    return this.eventRepository.findByOrganizerId(organizerId);
  }

  async search(query: string): Promise<SearchEventResponseDto[]> {
    return this.eventRepository.search(query);
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
  }
}
