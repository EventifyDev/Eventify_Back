import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantController } from './participant.controller';
import { ParticipantService } from '../providers/participant.service';
import { CreateParticipantDto } from '../dtos/create-participant.dto';
import { UpdateParticipantDto } from '../dtos/update-participant.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ParticipantDocument } from '../schemas/participant.schema';

describe('ParticipantController', () => {
  let controller: ParticipantController;
  let participantService: ParticipantService;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipantController],
      providers: [
        {
          provide: ParticipantService,
          useValue: {
            register: jest.fn(),
            update: jest.fn(),
            getEventParticipants: jest.fn(),
            cancelParticipation: jest.fn(),
            getParticipantCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ParticipantController>(ParticipantController);
    participantService = module.get<ParticipantService>(ParticipantService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should create a new participant', async () => {
      const createParticipantDto: CreateParticipantDto = {
        username: 'New Participant',
        email: 'new@example.com',
        phoneNumber: '1234567890',
        eventId: 'event-id-1',
      };

      jest
        .spyOn(participantService, 'register')
        .mockResolvedValue(mockParticipant);

      const result = await controller.register(createParticipantDto);

      expect(participantService.register).toHaveBeenCalledWith(
        createParticipantDto,
      );
      expect(result).toEqual(mockParticipant);
    });

    it('should propagate exceptions from service', async () => {
      const createParticipantDto: CreateParticipantDto = {
        username: 'New Participant',
        email: 'existing@example.com',
        phoneNumber: '1234567890',
        eventId: 'event-id-1',
      };

      jest
        .spyOn(participantService, 'register')
        .mockRejectedValue(new ConflictException('Email already registered'));

      await expect(controller.register(createParticipantDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update participant details', async () => {
      const updateParticipantDto: UpdateParticipantDto = {
        username: 'Updated Name',
      };

      const updatedParticipant = {
        ...mockParticipant,
        username: 'Updated Name',
      };

      jest
        .spyOn(participantService, 'update')
        .mockResolvedValue(updatedParticipant as ParticipantDocument);

      const result = await controller.update(
        'participant-id-1',
        updateParticipantDto,
      );

      expect(participantService.update).toHaveBeenCalledWith(
        'participant-id-1',
        updateParticipantDto,
      );
      expect(result).toEqual(updatedParticipant);
    });

    it('should propagate NotFoundException from service', async () => {
      jest
        .spyOn(participantService, 'update')
        .mockRejectedValue(new NotFoundException('Participant not found'));

      await expect(
        controller.update('non-existent-id', { username: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEventParticipants', () => {
    it('should return all participants for an event', async () => {
      jest
        .spyOn(participantService, 'getEventParticipants')
        .mockResolvedValue(mockParticipants);

      const result = await controller.getEventParticipants('event-id-1');

      expect(participantService.getEventParticipants).toHaveBeenCalledWith(
        'event-id-1',
      );
      expect(result).toEqual(mockParticipants);
      expect(result.length).toBe(2);
    });

    it('should propagate NotFoundException when no participants found', async () => {
      jest
        .spyOn(participantService, 'getEventParticipants')
        .mockRejectedValue(
          new NotFoundException('No participants found for this event'),
        );

      await expect(
        controller.getEventParticipants('event-id-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelParticipation', () => {
    it('should cancel a participant registration', async () => {
      jest
        .spyOn(participantService, 'cancelParticipation')
        .mockResolvedValue(true);

      const result = await controller.cancelParticipation('participant-id-1');

      expect(participantService.cancelParticipation).toHaveBeenCalledWith(
        'participant-id-1',
      );
      expect(result).toBe(true);
    });

    it('should propagate NotFoundException if participant not found', async () => {
      jest
        .spyOn(participantService, 'cancelParticipation')
        .mockRejectedValue(new NotFoundException('Participant not found'));

      await expect(
        controller.cancelParticipation('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getParticipantCount', () => {
    it('should return count of participants for a specific event', async () => {
      jest
        .spyOn(participantService, 'getParticipantCount')
        .mockResolvedValue(2);

      const result = await controller.getParticipantCount('event-id-1');

      expect(participantService.getParticipantCount).toHaveBeenCalledWith(
        'event-id-1',
      );
      expect(result).toBe(2);
    });

    it('should return total count of participants when no event specified', async () => {
      jest
        .spyOn(participantService, 'getParticipantCount')
        .mockResolvedValue(10);

      const result = await controller.getParticipantCount();

      expect(participantService.getParticipantCount).toHaveBeenCalledWith(
        undefined,
      );
      expect(result).toBe(10);
    });
  });
});
