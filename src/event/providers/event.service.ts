import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from '../repositories/event.repository';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { Event } from '../schemas/event.schema';
import { IEventService } from '../interfaces/event.interface';
import { UploadService } from '../../upload/providers/upload.service';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';

@Injectable()
export class EventService implements IEventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly uploadService: UploadService,
  ) {}

  async findAll(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<Event[]> {
    const events = await this.eventRepository.findAll(userId, page, limit);
    if (!events || events.length === 0) {
      throw new NotFoundException('Events not found');
    }
    return events;
  }

  async findById(id: string): Promise<Event> {
    return this.eventRepository.findById(id);
  }

  async create(
    createEventDto: CreateEventDto,
    organizerId: string,
    image?: Express.Multer.File,
  ): Promise<Event> {
    try {
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

      const eventData = {
        ...createEventDto,
        organizer: organizerId,
        image: imageUrl,
      };

      const createdEvent = await this.eventRepository.create(eventData);
      return createdEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new BadRequestException(`Failed to create event: ${error.message}`);
    }
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    image?: Express.Multer.File,
  ): Promise<Event> {
    try {
      const existingEvent = await this.eventRepository.findById(id);
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
      if (updateEventDto.date) {
        updateEventDto.date = new Date(updateEventDto.date);
      }

      return this.eventRepository.update(id, updateEventDto);
    } catch (error) {
      console.error('Error updating event:', error);
      throw new BadRequestException(`Failed to update event: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    return this.eventRepository.delete(id);
  }

  async findByOrganizerId(organizerId: string): Promise<Event[]> {
    return this.eventRepository.findByOrganizerId(organizerId);
  }

  async search(query: string): Promise<SearchEventResponseDto[]> {
    return this.eventRepository.search(query);
  }
}
