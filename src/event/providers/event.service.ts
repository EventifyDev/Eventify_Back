import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from '../repositories/event.repository';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { EventDocument } from '../schemas/event.schema';
import { IEventService } from '../interfaces/event.interface';
import { UploadService } from '../../upload/providers/upload.service';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';
import { NotificationService } from '../../notifications/providers/notification.service';
import { Types } from 'mongoose';
import { TicketService } from '../../ticket/providers/ticket.service';
import { TicketStatus } from '../../ticket/enums/ticket-status.enum';

@Injectable()
export class EventService implements IEventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly uploadService: UploadService,
    private readonly notificationService: NotificationService,
    private readonly ticketService: TicketService,
  ) {}

  async findAll(): Promise<EventDocument[]> {
    const events = await this.eventRepository.findAll();
    if (!events.length) {
      throw new NotFoundException('Events not found');
    }
    return events;
  }

  async findById(id: string): Promise<EventDocument> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const tickets = await this.ticketService.getTicketsByEventId(
      event._id.toString(),
    );

    const eventWithTickets = {
      ...event.toObject(),
      tickets: tickets,
    };

    return eventWithTickets as EventDocument;
  }

  async findByUserId(userId: string): Promise<EventDocument[]> {
    const events = await this.eventRepository.findByOrganizerId(userId);
    if (!events.length) {
      throw new NotFoundException('Events not found');
    }
    return events;
  }

  async findByOrganizerId(organizerId: string): Promise<EventDocument[]> {
    const events = await this.eventRepository.findByOrganizerId(organizerId);
    if (!events || events.length === 0) {
      throw new NotFoundException('Events not found');
    }
    return events;
  }

  async getPendingEvents(): Promise<EventDocument[]> {
    const events = await this.eventRepository.findPendingEvents();
    if (!events || events.length === 0) {
      throw new NotFoundException('No pending events found');
    }
    return events;
  }

  async approveEvent(eventId: string, adminId: string): Promise<EventDocument> {
    return this.updateEventStatus(eventId, adminId, true);
  }

  async rejectEvent(
    eventId: string,
    adminId: string,
    reason: string,
  ): Promise<EventDocument> {
    return this.updateEventStatus(eventId, adminId, false, reason);
  }

  private async updateEventStatus(
    eventId: string,
    adminId: string,
    isApproved: boolean,
    rejectionReason?: string,
  ): Promise<EventDocument> {
    const adminObjectId = new Types.ObjectId(adminId);

    const approvalData = {
      isApproved,
      reviewedBy: adminObjectId,
      ...(rejectionReason && { rejectionReason }),
    };

    const updatedEvent = await this.eventRepository.updateApprovalStatus(
      eventId,
      approvalData,
    );

    if (!updatedEvent) {
      throw new NotFoundException('Event not found');
    }

    await this.notifyEventStatusUpdate(
      updatedEvent,
      isApproved,
      rejectionReason,
    );

    return updatedEvent;
  }

  private async notifyEventStatusUpdate(
    event: EventDocument,
    isApproved: boolean,
    rejectionReason?: string,
  ): Promise<void> {
    const organizerId = this.extractOrganizerId(event);

    await this.notificationService.notifyOrganizerAboutEventApproval(
      event._id.toString(),
      event.name,
      organizerId,
      isApproved,
      rejectionReason,
    );
  }

  private extractOrganizerId(event: EventDocument): string {
    return typeof event.organizer === 'object' && event.organizer?._id
      ? event.organizer._id.toString()
      : String(event.organizer);
  }

  async create(
    createEventDto: CreateEventDto,
    organizerId: string,
    image?: Express.Multer.File,
  ): Promise<EventDocument> {
    const imageUrl = await this.processEventImage(createEventDto, image);

    const eventData = {
      ...createEventDto,
      organizer: organizerId,
      image: imageUrl,
      isApproved: false,
    };

    const createdEvent = await this.eventRepository.create(eventData);

    // Créer les tickets pour l'événement
    if (createEventDto.tickets && createEventDto.tickets.length > 0) {
      await Promise.all(
        createEventDto.tickets.map((ticketDto) =>
          this.ticketService.createTicket({
            event: createdEvent._id.toString(),
            type: ticketDto.type,
            price: ticketDto.price,
            quantity: ticketDto.quantity,
            status: TicketStatus.AVAILABLE,
          }),
        ),
      );
    }

    await this.notifyAdminsAboutNewEvent(createdEvent);

    return createdEvent;
  }

  private async notifyAdminsAboutNewEvent(event: EventDocument): Promise<void> {
    const organizerId = this.extractOrganizerId(event);

    await this.notificationService.notifyAdminsAboutNewEvent(
      event._id.toString(),
      event.name,
      organizerId,
    );
  }

  private async processEventImage(
    createEventDto: CreateEventDto,
    image?: Express.Multer.File,
  ): Promise<string> {
    if (image) {
      const uploadResult = await this.uploadService.uploadFile(image);
      return uploadResult.url;
    }

    if (
      createEventDto.image &&
      typeof createEventDto.image === 'string' &&
      createEventDto.image.startsWith('data:image')
    ) {
      return this.uploadBase64Image(createEventDto.image);
    }

    throw new BadRequestException('Image is required');
  }

  private async uploadBase64Image(base64Image: string): Promise<string> {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = base64Image.split(';')[0].split(':')[1];
    const fileExtension = mimeType.split('/')[1];

    const file = {
      buffer,
      mimetype: mimeType,
      originalname: `event-image-${Date.now()}.${fileExtension}`,
    } as Express.Multer.File;

    const uploadResult = await this.uploadService.uploadFile(file);
    return uploadResult.url;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    image?: Express.Multer.File,
  ): Promise<EventDocument> {
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
      if (updateEventDto.date) {
        updateEventDto.date = new Date(updateEventDto.date);
      }

      return this.eventRepository.update(id, updateEventDto);
    } catch (error) {
      throw new BadRequestException(`Failed to update event: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const deletedEvent = await this.eventRepository.delete(id);
    if (!deletedEvent) {
      throw new NotFoundException('Event not found');
    }
  }

  async search(query: string): Promise<SearchEventResponseDto[]> {
    return this.eventRepository.search(query);
  }
}
