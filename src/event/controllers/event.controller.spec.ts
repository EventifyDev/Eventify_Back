import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from '../providers/event.service';
import { ParticipantService } from '../../participant/providers/participant.service';
import { Types } from 'mongoose';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';
import { Event } from '../schemas/event.schema';
import { Participant } from '../../participant/schemas/participant.schema';
import { CreateEventDto } from '../dtos/create-event.dto';

describe('EventController', () => {
  let controller: EventController;
  let eventService: jest.Mocked<EventService>;
  let participantService: jest.Mocked<ParticipantService>;

  const mockEvent = {
    _id: new Types.ObjectId('674aee48082f45ab9d2e3fa9'),
    organizer: new Types.ObjectId('67482c7bcc7eec710127f1aa'),
    name: 'Brandon Harper',
    description: 'Nesciunt omnis dele Nesciunt omnis dele',
    date: new Date('2027-11-12T16:51:00.000Z'),
    capacity: 77,
    location: 'Alias id adipisicing',
    eventType: 'SPORT',
    image:
      'https://eventify-images.s3.amazonaws.com/uploads/c879cc42-4708-4381-abfc-9c5a9b63b232.png',
    createdAt: new Date('2024-11-30T10:51:52.733Z'),
    updatedAt: new Date('2024-11-30T13:56:31.616Z'),
    __v: 0,
  };

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
    const mockEventService = {
      search: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByOrganizerId: jest.fn(),
    };

    const mockParticipantService = {
      getEventParticipants: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: ParticipantService, useValue: mockParticipantService },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    eventService = module.get(EventService);
    participantService = module.get(ParticipantService);
  });

  describe('search', () => {
    it('should search events', async () => {
      const searchResults = [mockEvent];
      eventService.search.mockResolvedValue(
        searchResults as unknown as SearchEventResponseDto[],
      );

      const result = await controller.search('sport');
      expect(result).toEqual(searchResults);
      expect(eventService.search).toHaveBeenCalledWith('sport');
    });
  });

  describe('findAll', () => {
    it('should return all events with pagination', async () => {
      const events = [mockEvent];
      eventService.findAll.mockResolvedValue(events as unknown as Event[]);

      const result = await controller.findAll(
        '67482c7bcc7eec710127f1aa',
        1,
        10,
      );
      expect(result).toEqual(events);
      expect(eventService.findAll).toHaveBeenCalledWith(
        '67482c7bcc7eec710127f1aa',
        1,
        10,
      );
    });
  });

  describe('findById', () => {
    it('should return an event by id', async () => {
      eventService.findById.mockResolvedValue(mockEvent as unknown as Event);

      const result = await controller.findById('674aee48082f45ab9d2e3fa9');
      expect(result).toEqual(mockEvent);
      expect(eventService.findById).toHaveBeenCalledWith(
        '674aee48082f45ab9d2e3fa9',
      );
    });
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const createEventDto = {
        name: 'Brandon Harper',
        description: 'Nesciunt omnis dele Nesciunt omnis dele',
        date: new Date('2027-11-12T16:51:00.000Z'),
        capacity: 77,
        location: 'Alias id adipisicing',
        eventType: 'SPORT',
      };

      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const mockRequest = {
        user: { id: '67482c7bcc7eec710127f1aa' },
      };

      eventService.create.mockResolvedValue(mockEvent as unknown as Event);

      const result = await controller.create(
        createEventDto as unknown as CreateEventDto,
        mockRequest,
        mockFile,
      );
      expect(result).toEqual(mockEvent);
      expect(eventService.create).toHaveBeenCalledWith(
        createEventDto,
        '67482c7bcc7eec710127f1aa',
        mockFile,
      );
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const updateEventDto = {
        name: 'Updated Event Name',
        capacity: 100,
      };

      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'updated.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const updatedEvent = { ...mockEvent, ...updateEventDto };
      eventService.update.mockResolvedValue(updatedEvent as unknown as Event);

      const result = await controller.update(
        '674aee48082f45ab9d2e3fa9',
        updateEventDto,
        mockFile,
      );
      expect(result.name).toBe('Updated Event Name');
      expect(result.capacity).toBe(100);
      expect(eventService.update).toHaveBeenCalledWith(
        '674aee48082f45ab9d2e3fa9',
        updateEventDto,
        mockFile,
      );
    });
  });

  describe('delete', () => {
    it('should delete an event', async () => {
      eventService.delete.mockResolvedValue(true);

      const result = await controller.delete('674aee48082f45ab9d2e3fa9');
      expect(result).toBe(true);
      expect(eventService.delete).toHaveBeenCalledWith(
        '674aee48082f45ab9d2e3fa9',
      );
    });
  });

  describe('findByOrganizerId', () => {
    it('should return events by organizer id', async () => {
      const events = [mockEvent];
      eventService.findByOrganizerId.mockResolvedValue(
        events as unknown as Event[],
      );

      const result = await controller.findByOrganizerId(
        '67482c7bcc7eec710127f1aa',
      );
      expect(result).toEqual(events);
      expect(eventService.findByOrganizerId).toHaveBeenCalledWith(
        '67482c7bcc7eec710127f1aa',
      );
    });
  });

  describe('getEventParticipants', () => {
    it('should return participants for an event', async () => {
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
  });
});
