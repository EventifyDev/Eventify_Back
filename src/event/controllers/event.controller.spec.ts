import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from '../providers/event.service';
import { ParticipantService } from '../../participant/providers/participant.service';
import { CreateEventDto, EventType } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { NotificationService } from '../../notifications/providers/notification.service';
import { TicketService } from '../../ticket/providers/ticket.service';

describe('EventController', () => {
  let controller: EventController;
  let eventService: EventService;
  let participantService: ParticipantService;

  const mockEvent = {
    _id: 'event-id-1',
    name: 'Test Event',
    description: 'Test Description',
    date: new Date(),
    location: 'Test Location',
    organizerId: 'organizer-id-1',
    status: 'pending',
    imageUrl: 'https://example.com/image.jpg',
  };

  const mockEvents = [
    mockEvent,
    {
      _id: 'event-id-2',
      name: 'Test Event 2',
      description: 'Test Description 2',
      date: new Date(),
      location: 'Test Location 2',
      organizerId: 'organizer-id-1',
      status: 'approved',
      imageUrl: 'https://example.com/image2.jpg',
    },
  ];

  const mockParticipants = [
    {
      _id: 'participant-id-1',
      userId: 'user-id-1',
      eventId: 'event-id-1',
      status: 'confirmed',
    },
    {
      _id: 'participant-id-2',
      userId: 'user-id-2',
      eventId: 'event-id-1',
      status: 'pending',
    },
  ];

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
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: {
            search: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findByOrganizerId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            approveEvent: jest.fn(),
            rejectEvent: jest.fn(),
            getPendingEvents: jest.fn(),
          },
        },
        {
          provide: ParticipantService,
          useValue: {
            getEventParticipants: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendNotification: jest.fn(),
            notifyAdmins: jest.fn(),
          },
        },
        {
          provide: TicketService,
          useValue: {
            getTicketsByEventId: jest.fn(),
            createTicket: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    eventService = module.get<EventService>(EventService);
    participantService = module.get<ParticipantService>(ParticipantService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      jest.spyOn(eventService, 'findAll').mockResolvedValue(mockEvents as any);

      const result = await controller.findAll();

      expect(eventService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });
  });

  describe('findById', () => {
    it('should return a single event', async () => {
      jest.spyOn(eventService, 'findById').mockResolvedValue(mockEvent as any);

      const result = await controller.findById('event-id-1');

      expect(eventService.findById).toHaveBeenCalledWith('event-id-1');
      expect(result).toEqual(mockEvent);
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      jest.spyOn(eventService, 'search').mockResolvedValue(mockEvents as any);

      const result = await controller.search('test query');

      expect(eventService.search).toHaveBeenCalledWith('test query');
      expect(result).toEqual(mockEvents);
    });
  });

  describe('create', () => {
    it('should create and return a new event', async () => {
      const createEventDto: CreateEventDto = {
        name: 'New Event',
        description: 'New Description',
        date: new Date(),
        location: 'New Location',
        eventType: EventType.CULTURAL,
        capacity: 100,
        tickets: [],
      };

      const mockRequest = {
        user: { userId: 'user-id-1' },
      };

      jest.spyOn(eventService, 'create').mockResolvedValue(mockEvent as any);

      const result = await controller.create(
        createEventDto,
        mockRequest,
        mockFile,
      );

      expect(eventService.create).toHaveBeenCalledWith(
        createEventDto,
        'user-id-1',
        mockFile,
      );
      expect(result).toEqual(mockEvent);
    });
  });

  describe('update', () => {
    it('should update and return an event', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      jest.spyOn(eventService, 'update').mockResolvedValue({
        ...mockEvent,
        name: 'Updated Event',
      } as any);

      const result = await controller.update(
        'event-id-1',
        updateEventDto,
        mockFile,
      );

      expect(eventService.update).toHaveBeenCalledWith(
        'event-id-1',
        updateEventDto,
        mockFile,
      );
      expect(result).toHaveProperty('name', 'Updated Event');
    });
  });

  describe('delete', () => {
    it('should call the delete method', async () => {
      jest.spyOn(eventService, 'delete').mockResolvedValue(undefined);

      await controller.delete('event-id-1');

      expect(eventService.delete).toHaveBeenCalledWith('event-id-1');
    });
  });

  describe('approveEvent', () => {
    it('should approve an event', async () => {
      const mockRequest = {
        user: { userId: 'admin-id' },
      };

      jest.spyOn(eventService, 'approveEvent').mockResolvedValue({
        ...mockEvent,
        status: 'approved',
      } as any);

      const result = await controller.approveEvent('event-id-1', mockRequest);

      expect(eventService.approveEvent).toHaveBeenCalledWith(
        'event-id-1',
        'admin-id',
      );
      expect(result).toHaveProperty('status', 'approved');
    });
  });

  describe('rejectEvent', () => {
    it('should reject an event', async () => {
      const mockRequest = {
        user: { userId: 'admin-id' },
      };
      const reason = 'Rejection reason';

      jest.spyOn(eventService, 'rejectEvent').mockResolvedValue({
        ...mockEvent,
        status: 'rejected',
        rejectionReason: reason,
      } as any);

      const result = await controller.rejectEvent(
        'event-id-1',
        mockRequest,
        reason,
      );

      expect(eventService.rejectEvent).toHaveBeenCalledWith(
        'event-id-1',
        'admin-id',
        reason,
      );
      expect(result).toHaveProperty('status', 'rejected');
    });
  });

  describe('getEventParticipants', () => {
    it('should return participants for an event', async () => {
      jest
        .spyOn(participantService, 'getEventParticipants')
        .mockResolvedValue(mockParticipants as any);

      const result = await controller.getEventParticipants('event-id-1');

      expect(participantService.getEventParticipants).toHaveBeenCalledWith(
        'event-id-1',
      );
      expect(result).toEqual(mockParticipants);
    });
  });
});
