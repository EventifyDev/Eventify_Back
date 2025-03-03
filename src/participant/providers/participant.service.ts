import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IParticipantService } from '../interfaces/participant.interface';
import { IParticipantRepository } from '../interfaces/participant.repository.interface';
import { EventService } from '../../event/providers/event.service';
import { CreateParticipantDto } from '../dtos/create-participant.dto';
import { UpdateParticipantDto } from '../dtos/update-participant.dto';
import { Participant } from '../schemas/participant.schema';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class ParticipantService implements IParticipantService {
  constructor(
    @Inject('IParticipantRepository')
    private readonly participantRepository: IParticipantRepository,
    @Inject(forwardRef(() => EventService))
    private readonly eventService: EventService,
  ) {}

  async register(
    createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    await this.validateEvent(createParticipantDto.eventId);
    await this.validateUniqueEmail(
      createParticipantDto.email,
      createParticipantDto.eventId,
    );

    return this.participantRepository.create(createParticipantDto);
  }

  async update(
    id: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const participant = await this.participantRepository.findById(id);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (this.isEmailBeingUpdated(updateParticipantDto, participant)) {
      await this.validateUniqueEmail(
        updateParticipantDto.email,
        participant.event.toString(),
      );
    }

    return this.participantRepository.update(id, updateParticipantDto);
  }

  async getEventParticipants(eventId: string): Promise<Participant[]> {
    await this.validateEvent(eventId);

    const participants =
      await this.participantRepository.findByEventId(eventId);

    return participants;
  }

  async cancelParticipation(id: string): Promise<boolean> {
    const participant = await this.participantRepository.findById(id);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    return this.participantRepository.delete(id);
  }

  async getParticipantCount(eventId?: string): Promise<number> {
    return this.participantRepository.getParticipantCount(eventId);
  }

  private async validateEvent(eventId: string): Promise<void> {
    const event = await this.eventService.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
  }

  private async validateUniqueEmail(
    email: string,
    eventId: string,
  ): Promise<void> {
    const existingParticipant = await this.participantRepository.findByEmail(
      email,
      eventId,
    );

    if (existingParticipant) {
      throw new ConflictException('Email already registered for this event');
    }
  }

  private isEmailBeingUpdated(
    updateDto: UpdateParticipantDto,
    participant: Participant,
  ): boolean {
    return Boolean(updateDto.email && updateDto.email !== participant.email);
  }
}
