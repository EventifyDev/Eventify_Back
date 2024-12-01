import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantController } from './participant.controller';
import { ParticipantService } from '../providers/participant.service';
import { Types } from 'mongoose';
import { CreateParticipantDto } from '../dtos/create-participant.dto';
import { UpdateParticipantDto } from '../dtos/update-participant.dto';
import { Participant } from '../schemas/participant.schema';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ParticipantController', () => {
  let controller: ParticipantController;
  let participantService: jest.Mocked<ParticipantService>;
  let module: TestingModule;

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

  beforeEach(async () => {
    const mockParticipantService = {
      register: jest.fn(),
      update: jest.fn(),
      getEventParticipants: jest.fn(),
      cancelParticipation: jest.fn(),
      getParticipantCount: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [ParticipantController],
      providers: [
        {
          provide: ParticipantService,
          useValue: mockParticipantService,
        },
      ],
    }).compile();

    controller = module.get<ParticipantController>(ParticipantController);
    participantService = module.get(ParticipantService);
  });

  afterEach(async () => {
    await module.close();
  });

  afterAll(async () => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('register', () => {
    it('should register a new participant', async () => {
      const createParticipantDto: CreateParticipantDto = {
        eventId: '674ae609082f45ab9d29decd',
        username: 'witov',
        email: 'wopesewina@mailinator.com',
        phoneNumber: '+1 (306) 673-8939',
      };

      participantService.register.mockResolvedValue(
        mockParticipant as unknown as Participant,
      );

      const result = await controller.register(createParticipantDto);

      expect(result).toEqual(mockParticipant);
      expect(participantService.register).toHaveBeenCalledWith(
        createParticipantDto,
      );
    });

    it('should handle registration errors', async () => {
      const createParticipantDto: CreateParticipantDto = {
        eventId: '674ae609082f45ab9d29decd',
        username: 'witov',
        email: 'wopesewina@mailinator.com',
        phoneNumber: '+1 (306) 673-8939',
      };

      participantService.register.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(controller.register(createParticipantDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update participant information', async () => {
      const updateParticipantDto: UpdateParticipantDto = {
        username: 'updated-witov',
      };

      const updatedParticipant = {
        ...mockParticipant,
        username: 'updated-witov',
        updatedAt: new Date(),
      };

      participantService.update.mockResolvedValue(
        updatedParticipant as unknown as Participant,
      );

      const result = await controller.update(
        '674b4d60de2603d783700c1e',
        updateParticipantDto,
      );

      expect(result.username).toBe('updated-witov');
      expect(participantService.update).toHaveBeenCalledWith(
        '674b4d60de2603d783700c1e',
        updateParticipantDto,
      );
    });

    it('should handle update errors', async () => {
      const updateParticipantDto: UpdateParticipantDto = {
        username: 'updated-witov',
      };

      participantService.update.mockRejectedValue(
        new NotFoundException('Participant not found'),
      );

      await expect(
        controller.update('674b4d60de2603d783700c1e', updateParticipantDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEventParticipants', () => {
    it('should return all participants for an event', async () => {
      const participants = [mockParticipant];
      participantService.getEventParticipants.mockResolvedValue(
        participants as unknown as Participant[],
      );

      const result = await controller.getEventParticipants(
        '674ae609082f45ab9d29decd',
      );

      expect(result).toEqual(participants);
      expect(participantService.getEventParticipants).toHaveBeenCalledWith(
        '674ae609082f45ab9d29decd',
      );
    });

    it('should handle no participants found', async () => {
      participantService.getEventParticipants.mockRejectedValue(
        new NotFoundException('No participants found for this event'),
      );

      await expect(
        controller.getEventParticipants('674ae609082f45ab9d29decd'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelParticipation', () => {
    it('should cancel participation', async () => {
      participantService.cancelParticipation.mockResolvedValue(true);

      const result = await controller.cancelParticipation(
        '674b4d60de2603d783700c1e',
      );

      expect(result).toBe(true);
      expect(participantService.cancelParticipation).toHaveBeenCalledWith(
        '674b4d60de2603d783700c1e',
      );
    });

    it('should handle cancellation errors', async () => {
      participantService.cancelParticipation.mockRejectedValue(
        new NotFoundException('Participant not found'),
      );

      await expect(
        controller.cancelParticipation('674b4d60de2603d783700c1e'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getParticipantCount', () => {
    it('should return participant count for an event', async () => {
      participantService.getParticipantCount.mockResolvedValue(5);

      const result = await controller.getParticipantCount(
        '674ae609082f45ab9d29decd',
      );

      expect(result).toBe(5);
      expect(participantService.getParticipantCount).toHaveBeenCalledWith(
        '674ae609082f45ab9d29decd',
      );
    });

    it('should return total participant count when no eventId provided', async () => {
      participantService.getParticipantCount.mockResolvedValue(10);

      const result = await controller.getParticipantCount();

      expect(result).toBe(10);
      expect(participantService.getParticipantCount).toHaveBeenCalledWith(
        undefined,
      );
    });

    it('should handle count errors', async () => {
      participantService.getParticipantCount.mockRejectedValue(
        new Error('Failed to get count'),
      );

      await expect(
        controller.getParticipantCount('674ae609082f45ab9d29decd'),
      ).rejects.toThrow('Failed to get count');
    });
  });
});
