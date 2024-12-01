import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { EventRepository } from '../repositories/event.repository';
import { UploadService } from '../../upload/providers/upload.service';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateEventDto } from '../dtos/create-event.dto';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';
import { Event } from '../schemas/event.schema';

describe('EventService', () => {
  let service: EventService;
  let eventRepository: jest.Mocked<EventRepository>;
  let uploadService: jest.Mocked<UploadService>;

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

  beforeEach(async () => {
    const mockEventRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByOrganizerId: jest.fn(),
      search: jest.fn(),
    };

    const mockUploadService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: EventRepository,
          useValue: mockEventRepository,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventRepository = module.get(EventRepository);
    uploadService = module.get(UploadService);
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      const events = [mockEvent];
      eventRepository.findAll.mockResolvedValue(events as unknown as Event[]);

      const result = await service.findAll('user-id', 1, 10);
      expect(result).toEqual(events);
    });

    it('should throw NotFoundException when no events found', async () => {
      eventRepository.findAll.mockResolvedValue([]);

      await expect(service.findAll('user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return an event by id', async () => {
      eventRepository.findById.mockResolvedValue(mockEvent as unknown as Event);

      const result = await service.findById('674aee48082f45ab9d2e3fa9');
      expect(result).toEqual(mockEvent);
    });
  });

  describe('create', () => {
    it('should create event with uploaded file', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const createEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: new Date(),
        location: 'Test Location',
        capacity: 100,
        eventType: 'SPORT',
      };

      uploadService.uploadFile.mockResolvedValue({
        url: 'image-url',
        key: 'key',
      });
      eventRepository.create.mockResolvedValue(mockEvent as unknown as Event);

      const result = await service.create(
        createEventDto as unknown as CreateEventDto,
        'organizer-id',
        mockFile,
      );

      expect(uploadService.uploadFile).toHaveBeenCalled();
      expect(eventRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should create event with base64 image', async () => {
      const createEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: new Date(),
        location: 'Test Location',
        capacity: 100,
        eventType: 'SPORT',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      };

      uploadService.uploadFile.mockResolvedValue({
        url: 'image-url',
        key: 'key',
      });
      eventRepository.create.mockResolvedValue(mockEvent as unknown as Event);

      const result = await service.create(
        createEventDto as unknown as CreateEventDto,
        'organizer-id',
      );
      expect(result).toEqual(mockEvent);
    });

    it('should throw BadRequestException when no image provided', async () => {
      const createEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: new Date(),
        location: 'Test Location',
        capacity: 100,
        eventType: 'SPORT',
      };

      await expect(
        service.create(
          createEventDto as unknown as CreateEventDto,
          'organizer-id',
        ),
      ).rejects.toThrow('Failed to create event: Image is required');
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const updateEventDto = {
        name: 'Updated Name',
      };

      eventRepository.findById.mockResolvedValue(mockEvent as unknown as Event);
      eventRepository.update.mockResolvedValue({
        ...mockEvent,
        ...updateEventDto,
      } as unknown as Event);

      const result = await service.update('event-id', updateEventDto);
      expect(result.name).toBe('Updated Name');
    });

    it('should update event with new image', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      eventRepository.findById.mockResolvedValue(mockEvent as unknown as Event);
      uploadService.uploadFile.mockResolvedValue({
        url: 'new-image-url',
        key: 'new-key',
      });
      eventRepository.update.mockResolvedValue({
        ...mockEvent,
        image: 'new-image-url',
      } as unknown as Event);

      const result = await service.update('event-id', {}, mockFile);
      expect(result.image).toBe('new-image-url');
    });

    it('should throw NotFoundException when event not found', async () => {
      eventRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Updated' }),
      ).rejects.toThrow('Failed to update event: Event not found');
    });
  });

  describe('delete', () => {
    it('should delete an event', async () => {
      eventRepository.delete.mockResolvedValue(true);

      const result = await service.delete('event-id');
      expect(result).toBe(true);
    });
  });

  describe('findByOrganizerId', () => {
    it('should return events by organizer id', async () => {
      const events = [mockEvent];
      eventRepository.findByOrganizerId.mockResolvedValue(
        events as unknown as Event[],
      );

      const result = await service.findByOrganizerId('organizer-id');
      expect(result).toEqual(events);
    });
  });

  describe('search', () => {
    it('should search events', async () => {
      const events = [mockEvent];
      eventRepository.search.mockResolvedValue(
        events as unknown as SearchEventResponseDto[],
      );

      const result = await service.search('query');
      expect(result).toEqual(events);
    });
  });
});
