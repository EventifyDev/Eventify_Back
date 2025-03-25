import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { EventRepository } from '../repositories/event.repository';
import { UploadService } from '../../upload/providers/upload.service';
import { NotificationService } from '../../notifications/providers/notification.service';
import { TicketService } from '../../ticket/providers/ticket.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateEventDto, EventType } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { Types } from 'mongoose';
import { TicketStatus } from '../../ticket/enums/ticket-status.enum';
import { TicketType } from '../../ticket/enums/ticket-type.enum';

describe('EventService', () => {
  let service: EventService;
  let eventRepository: EventRepository;
  let uploadService: UploadService;
  let notificationService: NotificationService;
  let ticketService: TicketService;

  const mockEvent = {
    _id: new Types.ObjectId('6477f7ad159b0f0ef2a39101'),
    name: 'Test Event',
    description: 'Test Description',
    date: new Date(),
    location: 'Test Location',
    organizer: new Types.ObjectId('6477f7ad159b0f0ef2a39102'),
    isApproved: false,
    status: 'pending',
    image: 'https://example.com/image.jpg',
    toObject: jest.fn().mockReturnValue({
      _id: new Types.ObjectId('6477f7ad159b0f0ef2a39101'),
      name: 'Test Event',
      description: 'Test Description',
      date: new Date(),
      location: 'Test Location',
      organizer: new Types.ObjectId('6477f7ad159b0f0ef2a39102'),
      isApproved: false,
      status: 'pending',
      image: 'https://example.com/image.jpg',
    }),
  };

  const mockEvents = [mockEvent];

  const mockTicket = {
    _id: new Types.ObjectId('6477f7ad159b0f0ef2a39103'),
    event: new Types.ObjectId('6477f7ad159b0f0ef2a39101'),
    type: TicketType.VIP,
    price: 100,
    quantity: 10,
    status: TicketStatus.AVAILABLE,
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'image',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('mock image content'),
    size: 1234,
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: EventRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByOrganizerId: jest.fn(),
            findPendingEvents: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            search: jest.fn(),
            updateApprovalStatus: jest.fn(),
          },
        },
        {
          provide: UploadService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            notifyOrganizerAboutEventApproval: jest.fn(),
            notifyAdminsAboutNewEvent: jest.fn(),
          },
        },
        {
          provide: TicketService,
          useValue: {
            createTicket: jest.fn(),
            getTicketsByEventId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventRepository = module.get<EventRepository>(EventRepository);
    uploadService = module.get<UploadService>(UploadService);
    notificationService = module.get<NotificationService>(NotificationService);
    ticketService = module.get<TicketService>(TicketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      jest
        .spyOn(eventRepository, 'findAll')
        .mockResolvedValue(mockEvents as any);

      const result = await service.findAll();

      expect(eventRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });

    it('should throw NotFoundException if no events found', async () => {
      jest.spyOn(eventRepository, 'findAll').mockResolvedValue([]);

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return an event by id with tickets', async () => {
      jest
        .spyOn(eventRepository, 'findById')
        .mockResolvedValue(mockEvent as any);
      jest
        .spyOn(ticketService, 'getTicketsByEventId')
        .mockResolvedValue([mockTicket] as any);

      const result = await service.findById('6477f7ad159b0f0ef2a39101');

      expect(eventRepository.findById).toHaveBeenCalledWith(
        '6477f7ad159b0f0ef2a39101',
      );
      expect(ticketService.getTicketsByEventId).toHaveBeenCalledWith(
        '6477f7ad159b0f0ef2a39101',
      );
      expect(result).toHaveProperty('tickets');
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(eventRepository, 'findById').mockResolvedValue(null);

      await expect(
        service.findById('6477f7ad159b0f0ef2a39101'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create an event with uploaded image', async () => {
      const createEventDto: CreateEventDto = {
        name: 'New Event',
        description: 'New Description',
        date: new Date(),
        location: 'New Location',
        eventType: EventType.CULTURAL,
        capacity: 100,
        tickets: [
          {
            type: TicketType.VIP,
            price: 100,
            quantity: 10,
          },
        ],
      };

      jest.spyOn(uploadService, 'uploadFile').mockResolvedValue({
        url: 'https://example.com/uploaded-image.jpg',
        key: 'uploads/image-key.jpg',
      });
      jest.spyOn(eventRepository, 'create').mockResolvedValue(mockEvent as any);
      jest
        .spyOn(ticketService, 'createTicket')
        .mockResolvedValue(mockTicket as any);
      jest
        .spyOn(notificationService, 'notifyAdminsAboutNewEvent')
        .mockResolvedValue(undefined);

      const result = await service.create(
        createEventDto,
        '6477f7ad159b0f0ef2a39102',
        mockFile,
      );

      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(eventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Event',
          organizer: '6477f7ad159b0f0ef2a39102',
          image: 'https://example.com/uploaded-image.jpg',
          isApproved: false,
        }),
      );
      expect(ticketService.createTicket).toHaveBeenCalledTimes(1);
      expect(notificationService.notifyAdminsAboutNewEvent).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should throw BadRequestException if no image provided', async () => {
      const createEventDto: CreateEventDto = {
        name: 'New Event',
        description: 'New Description',
        date: new Date(),
        location: 'New Location',
        eventType: EventType.CULTURAL,
        capacity: 100,
        tickets: [],
      };

      await expect(
        service.create(createEventDto, '6477f7ad159b0f0ef2a39102'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      const updatedEvent = {
        ...mockEvent,
        name: 'Updated Event',
      };

      jest
        .spyOn(eventRepository, 'findById')
        .mockResolvedValue(mockEvent as any);
      jest
        .spyOn(eventRepository, 'update')
        .mockResolvedValue(updatedEvent as any);

      const result = await service.update(
        '6477f7ad159b0f0ef2a39101',
        updateEventDto,
      );

      expect(eventRepository.findById).toHaveBeenCalledWith(
        '6477f7ad159b0f0ef2a39101',
      );
      expect(eventRepository.update).toHaveBeenCalledWith(
        '6477f7ad159b0f0ef2a39101',
        updateEventDto,
      );
      expect(result).toEqual(updatedEvent);
    });

    it('should update an event with a new image', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      const updatedEvent = {
        ...mockEvent,
        name: 'Updated Event',
        image: 'https://example.com/new-image.jpg',
      };

      jest
        .spyOn(eventRepository, 'findById')
        .mockResolvedValue(mockEvent as any);
      jest.spyOn(uploadService, 'uploadFile').mockResolvedValue({
        url: 'https://example.com/new-image.jpg',
        key: 'uploads/new-image-key.jpg',
      });
      jest
        .spyOn(eventRepository, 'update')
        .mockResolvedValue(updatedEvent as any);

      const result = await service.update(
        '6477f7ad159b0f0ef2a39101',
        updateEventDto,
        mockFile,
      );

      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(eventRepository.update).toHaveBeenCalledWith(
        '6477f7ad159b0f0ef2a39101',
        expect.objectContaining({
          name: 'Updated Event',
          image: 'https://example.com/new-image.jpg',
        }),
      );
      expect(result).toEqual(updatedEvent);
    });

    it('should throw BadRequestException with "Event not found" message if event not found', async () => {
      jest.spyOn(eventRepository, 'findById').mockResolvedValue(null);

      await expect(
        service.update('6477f7ad159b0f0ef2a39101', {}),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.update('6477f7ad159b0f0ef2a39101', {}),
      ).rejects.toThrow('Failed to update event: Event not found');
    });
  });

  describe('delete', () => {
    it('should delete an event', async () => {
      jest.spyOn(eventRepository, 'delete').mockResolvedValue(mockEvent as any);

      await service.delete('6477f7ad159b0f0ef2a39101');

      expect(eventRepository.delete).toHaveBeenCalledWith(
        '6477f7ad159b0f0ef2a39101',
      );
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(eventRepository, 'delete').mockResolvedValue(null);

      await expect(service.delete('6477f7ad159b0f0ef2a39101')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approveEvent', () => {
    it('should approve an event and send notification', async () => {
      const approvedEvent = {
        ...mockEvent,
        isApproved: true,
        reviewedBy: new Types.ObjectId('6477f7ad159b0f0ef2a39104'),
      };

      jest
        .spyOn(eventRepository, 'updateApprovalStatus')
        .mockResolvedValue(approvedEvent as any);
      jest
        .spyOn(notificationService, 'notifyOrganizerAboutEventApproval')
        .mockResolvedValue(undefined);

      const result = await service.approveEvent(
        '6477f7ad159b0f0ef2a39101',
        '6477f7ad159b0f0ef2a39104',
      );

      expect(eventRepository.updateApprovalStatus).toHaveBeenCalledWith(
        '6477f7ad159b0f0ef2a39101',
        expect.objectContaining({
          isApproved: true,
          reviewedBy: expect.any(Types.ObjectId),
        }),
      );
      expect(
        notificationService.notifyOrganizerAboutEventApproval,
      ).toHaveBeenCalled();
      expect(result).toEqual(approvedEvent);
    });
  });

  describe('rejectEvent', () => {
    it('should reject an event with reason and send notification', async () => {
      const rejectedEvent = {
        ...mockEvent,
        isApproved: false,
        reviewedBy: new Types.ObjectId('6477f7ad159b0f0ef2a39104'),
        rejectionReason: 'Content violation',
      };

      jest
        .spyOn(eventRepository, 'updateApprovalStatus')
        .mockResolvedValue(rejectedEvent as any);
      jest
        .spyOn(notificationService, 'notifyOrganizerAboutEventApproval')
        .mockResolvedValue(undefined);

      const result = await service.rejectEvent(
        '6477f7ad159b0f0ef2a39101',
        '6477f7ad159b0f0ef2a39104',
        'Content violation',
      );

      expect(eventRepository.updateApprovalStatus).toHaveBeenCalledWith(
        '6477f7ad159b0f0ef2a39101',
        expect.objectContaining({
          isApproved: false,
          reviewedBy: expect.any(Types.ObjectId),
          rejectionReason: 'Content violation',
        }),
      );
      expect(
        notificationService.notifyOrganizerAboutEventApproval,
      ).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        false,
        'Content violation',
      );
      expect(result).toEqual(rejectedEvent);
    });
  });

  describe('search', () => {
    it('should search events', async () => {
      const searchResults = [mockEvent];
      jest
        .spyOn(eventRepository, 'search')
        .mockResolvedValue(searchResults as any);

      const result = await service.search('test');

      expect(eventRepository.search).toHaveBeenCalledWith('test');
      expect(result).toEqual(searchResults);
    });
  });
});
