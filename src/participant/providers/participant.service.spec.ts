import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantService } from './participant.service';
import { EventService } from '../../event/providers/event.service';
import { CreateParticipantDto } from '../dtos/create-participant.dto';
import { UpdateParticipantDto } from '../dtos/update-participant.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ParticipantDocument } from '../schemas/participant.schema';

describe('ParticipantService', () => {
  let service: ParticipantService;
  let participantRepository: any;
  let eventService: EventService;

  const mockEvent = {
    _id: 'event-id-1',
    name: 'Test Event',
    description: 'Event Description',
    date: new Date(),
    location: 'Test Location',
  };

  const mockParticipant = {
    _id: 'participant-id-1',
    username: 'Test Participant',
    email: 'participant@example.com',
    phoneNumber: '1234567890',
    event: 'event-id-1',
  } as unknown as ParticipantDocument;

  const mockParticipants = [
    mockParticipant,
    {
      _id: 'participant-id-2',
      username: 'Second Participant',
      email: 'second@example.com',
      phoneNumber: '0987654321',
      event: 'event-id-1',
    } as unknown as ParticipantDocument,
  ];

  beforeEach(async () => {
    participantRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEventId: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn(),
      getParticipantCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantService,
        {
          provide: 'IParticipantRepository',
          useValue: participantRepository,
        },
        {
          provide: EventService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ParticipantService>(ParticipantService);
    eventService = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new participant', async () => {
      const createParticipantDto: CreateParticipantDto = {
        username: 'New Participant',
        email: 'new@example.com',
        phoneNumber: '1234567890',
        eventId: 'event-id-1',
      };

      jest.spyOn(eventService, 'findById').mockResolvedValue(mockEvent as any);
      participantRepository.findByEmail.mockResolvedValue(null);
      participantRepository.create.mockResolvedValue({
        _id: 'new-participant-id',
        ...createParticipantDto,
        event: createParticipantDto.eventId,
      });

      const result = (await service.register(
        createParticipantDto,
      )) as ParticipantDocument;

      expect(eventService.findById).toHaveBeenCalledWith('event-id-1');
      expect(participantRepository.findByEmail).toHaveBeenCalledWith(
        'new@example.com',
        'event-id-1',
      );
      expect(participantRepository.create).toHaveBeenCalledWith(
        createParticipantDto,
      );
      expect(result._id).toEqual('new-participant-id');
    });

    it('should throw NotFoundException if event not found', async () => {
      const createParticipantDto: CreateParticipantDto = {
        username: 'New Participant',
        email: 'new@example.com',
        phoneNumber: '1234567890',
        eventId: 'non-existent-event',
      };

      jest.spyOn(eventService, 'findById').mockResolvedValue(null);

      await expect(service.register(createParticipantDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if email already registered for event', async () => {
      const createParticipantDto: CreateParticipantDto = {
        username: 'New Participant',
        email: 'existing@example.com',
        phoneNumber: '1234567890',
        eventId: 'event-id-1',
      };

      jest.spyOn(eventService, 'findById').mockResolvedValue(mockEvent as any);
      participantRepository.findByEmail.mockResolvedValue(mockParticipant);

      await expect(service.register(createParticipantDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update participant details', async () => {
      const updateParticipantDto: UpdateParticipantDto = {
        username: 'Updated Name',
      };

      participantRepository.findById.mockResolvedValue(mockParticipant);
      participantRepository.update.mockResolvedValue({
        ...mockParticipant,
        username: 'Updated Name',
      });

      const result = await service.update(
        'participant-id-1',
        updateParticipantDto,
      );

      expect(participantRepository.findById).toHaveBeenCalledWith(
        'participant-id-1',
      );
      expect(participantRepository.update).toHaveBeenCalledWith(
        'participant-id-1',
        updateParticipantDto,
      );
      expect(result.username).toEqual('Updated Name');
    });

    it('should validate email uniqueness when updating email', async () => {
      const updateParticipantDto: UpdateParticipantDto = {
        email: 'new@example.com',
      };

      participantRepository.findById.mockResolvedValue(mockParticipant);
      participantRepository.findByEmail.mockResolvedValue(null);
      participantRepository.update.mockResolvedValue({
        ...mockParticipant,
        email: 'new@example.com',
      });

      const result = await service.update(
        'participant-id-1',
        updateParticipantDto,
      );

      expect(participantRepository.findByEmail).toHaveBeenCalledWith(
        'new@example.com',
        'event-id-1',
      );
      expect(result.email).toEqual('new@example.com');
    });

    it('should throw NotFoundException if participant not found', async () => {
      participantRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { username: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEventParticipants', () => {
    it('should return all participants for an event', async () => {
      jest.spyOn(eventService, 'findById').mockResolvedValue(mockEvent as any);
      participantRepository.findByEventId.mockResolvedValue(mockParticipants);

      const result = await service.getEventParticipants('event-id-1');

      expect(eventService.findById).toHaveBeenCalledWith('event-id-1');
      expect(participantRepository.findByEventId).toHaveBeenCalledWith(
        'event-id-1',
      );
      expect(result).toEqual(mockParticipants);
      expect(result.length).toBe(2);
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(eventService, 'findById').mockResolvedValue(null);

      await expect(
        service.getEventParticipants('non-existent-event'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if no participants found', async () => {
      jest.spyOn(eventService, 'findById').mockResolvedValue(mockEvent as any);
      participantRepository.findByEventId.mockResolvedValue([]);

      await expect(service.getEventParticipants('event-id-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelParticipation', () => {
    it('should cancel a participant registration', async () => {
      participantRepository.findById.mockResolvedValue(mockParticipant);
      participantRepository.delete.mockResolvedValue(true);

      const result = await service.cancelParticipation('participant-id-1');

      expect(participantRepository.findById).toHaveBeenCalledWith(
        'participant-id-1',
      );
      expect(participantRepository.delete).toHaveBeenCalledWith(
        'participant-id-1',
      );
      expect(result).toBe(true);
    });

    it('should throw NotFoundException if participant not found', async () => {
      participantRepository.findById.mockResolvedValue(null);

      await expect(
        service.cancelParticipation('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getParticipantCount', () => {
    it('should return count of participants for a specific event', async () => {
      participantRepository.getParticipantCount.mockResolvedValue(2);

      const result = await service.getParticipantCount('event-id-1');

      expect(participantRepository.getParticipantCount).toHaveBeenCalledWith(
        'event-id-1',
      );
      expect(result).toBe(2);
    });

    it('should return total count of participants when no event specified', async () => {
      participantRepository.getParticipantCount.mockResolvedValue(10);

      const result = await service.getParticipantCount();

      expect(participantRepository.getParticipantCount).toHaveBeenCalledWith(
        undefined,
      );
      expect(result).toBe(10);
    });
  });
});
