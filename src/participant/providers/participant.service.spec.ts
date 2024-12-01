import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantService } from './participant.service';
import { EventService } from '../../event/providers/event.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Participant } from '../schemas/participant.schema';
import { Event } from '../../event/schemas/event.schema';
describe('ParticipantService', () => {
  let service: ParticipantService;
  let participantRepository: any;
  let eventService: jest.Mocked<EventService>;

  const mockParticipant = {
    _id: new Types.ObjectId('674b4d60de2603d783700c1e'),
    event: new Types.ObjectId('674ae609082f45ab9d29decd'),
    username: 'witov',
    email: 'wopesewina@mailinator.com',
    phoneNumber: '+1 (306) 673-8939',
    createdAt: new Date('2024-11-30T17:37:36.438Z'),
    updatedAt: new Date('2024-11-30T17:37:36.438Z'),
    __v: 0,
  };

  const mockEvent = {
    _id: new Types.ObjectId('674ae609082f45ab9d29decd'),
    name: 'Test Event',
    description: 'Test Description',
    date: new Date(),
    capacity: 100,
    location: 'Test Location',
    eventType: 'SPORT',
  };

  beforeEach(async () => {
    const mockParticipantRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEventId: jest.fn(),
      delete: jest.fn(),
      getParticipantCount: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockEventService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantService,
        {
          provide: 'IParticipantRepository',
          useValue: mockParticipantRepository,
        },
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    service = module.get<ParticipantService>(ParticipantService);
    participantRepository = module.get('IParticipantRepository');
    eventService = module.get(EventService);
  });

  describe('register', () => {
    it('should register a new participant', async () => {
      const createParticipantDto = {
        eventId: '674ae609082f45ab9d29decd',
        username: 'witov',
        email: 'wopesewina@mailinator.com',
        phoneNumber: '+1 (306) 673-8939',
      };

      eventService.findById.mockResolvedValue(mockEvent as unknown as Event);
      participantRepository.findByEmail.mockResolvedValue(null);
      participantRepository.create.mockResolvedValue(mockParticipant);

      const result = await service.register(createParticipantDto);

      expect(result).toEqual(mockParticipant);
      expect(eventService.findById).toHaveBeenCalledWith(
        createParticipantDto.eventId,
      );
      expect(participantRepository.findByEmail).toHaveBeenCalledWith(
        createParticipantDto.email,
        createParticipantDto.eventId,
      );
    });

    it('should throw NotFoundException when event not found', async () => {
      const createParticipantDto = {
        eventId: '674ae609082f45ab9d29decd',
        username: 'witov',
        email: 'test@test.com',
        phoneNumber: '+1 (306) 673-8939',
      };

      eventService.findById.mockResolvedValue(null);

      await expect(service.register(createParticipantDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when email already registered', async () => {
      const createParticipantDto = {
        eventId: '674ae609082f45ab9d29decd',
        username: 'witov',
        email: 'wopesewina@mailinator.com',
        phoneNumber: '+1 (306) 673-8939',
      };

      eventService.findById.mockResolvedValue(mockEvent as unknown as Event);
      participantRepository.findByEmail.mockResolvedValue(mockParticipant);

      await expect(service.register(createParticipantDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update participant details', async () => {
      const updateParticipantDto = {
        username: 'updated-witov',
      };

      const updatedParticipant = {
        ...mockParticipant,
        username: 'updated-witov',
        updatedAt: new Date(),
      };

      participantRepository.findById.mockResolvedValue(mockParticipant);
      participantRepository.update.mockResolvedValue(updatedParticipant);

      const result = await service.update(
        '674b4d60de2603d783700c1e',
        updateParticipantDto,
      );

      expect(result.username).toBe('updated-witov');
      expect(participantRepository.update).toHaveBeenCalledWith(
        '674b4d60de2603d783700c1e',
        updateParticipantDto,
      );
    });

    it('should throw NotFoundException when participant not found', async () => {
      participantRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('674b4d60de2603d783700c1e', { username: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate email uniqueness when updating email', async () => {
      const updateParticipantDto = {
        email: 'new@mailinator.com',
      };

      participantRepository.findById.mockResolvedValue(mockParticipant);
      participantRepository.findByEmail.mockResolvedValue(null);
      participantRepository.update.mockResolvedValue({
        ...mockParticipant,
        ...updateParticipantDto,
        updatedAt: new Date(),
      });

      const result = await service.update(
        '674b4d60de2603d783700c1e',
        updateParticipantDto,
      );

      expect(result.email).toBe('new@mailinator.com');
      expect(participantRepository.findByEmail).toHaveBeenCalled();
    });
  });

  describe('getEventParticipants', () => {
    it('should return all participants for an event', async () => {
      const participants = [mockParticipant];
      eventService.findById.mockResolvedValue(mockEvent as unknown as Event);
      participantRepository.findByEventId.mockResolvedValue(
        participants as unknown as Participant[],
      );

      const result = await service.getEventParticipants(
        '674ae609082f45ab9d29decd',
      );

      expect(result).toEqual(participants);
      expect(participantRepository.findByEventId).toHaveBeenCalledWith(
        '674ae609082f45ab9d29decd',
      );
    });

    it('should throw NotFoundException when no participants found', async () => {
      eventService.findById.mockResolvedValue(mockEvent as unknown as Event);
      participantRepository.findByEventId.mockResolvedValue([]);

      await expect(
        service.getEventParticipants('674ae609082f45ab9d29decd'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelParticipation', () => {
    it('should cancel participation', async () => {
      participantRepository.findById.mockResolvedValue(mockParticipant);
      participantRepository.delete.mockResolvedValue(true);

      const result = await service.cancelParticipation(
        '674b4d60de2603d783700c1e',
      );

      expect(result).toBe(true);
      expect(participantRepository.delete).toHaveBeenCalledWith(
        '674b4d60de2603d783700c1e',
      );
    });

    it('should throw NotFoundException when participant not found', async () => {
      participantRepository.findById.mockResolvedValue(null);

      await expect(
        service.cancelParticipation('674b4d60de2603d783700c1e'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getParticipantCount', () => {
    it('should return participant count for an event', async () => {
      participantRepository.getParticipantCount.mockResolvedValue(5);

      const result = await service.getParticipantCount(
        '674ae609082f45ab9d29decd',
      );

      expect(result).toBe(5);
      expect(participantRepository.getParticipantCount).toHaveBeenCalledWith(
        '674ae609082f45ab9d29decd',
      );
    });

    it('should return total participant count when no eventId provided', async () => {
      participantRepository.getParticipantCount.mockResolvedValue(10);

      const result = await service.getParticipantCount();

      expect(result).toBe(10);
      expect(participantRepository.getParticipantCount).toHaveBeenCalledWith(
        undefined,
      );
    });
  });
});
