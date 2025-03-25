import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../providers/notification.service';
import { EventService } from '../../event/providers/event.service';
import { Logger } from '@nestjs/common';
import { EventApprovalDto } from '../dtos/event-approval.dto';
import { Notification } from '../schemas/notification.schema';
import { EventDocument } from '../../event/schemas/event.schema';
import { RoleService } from '../../roles/providers/role.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: NotificationService;
  let eventService: EventService;

  const mockNotifications = [
    {
      _id: 'notif-id-1',
      userId: 'user-id-1',
      title: 'Test Notification',
      message: 'This is a test notification',
      read: false,
      type: 'INFO',
      createdAt: new Date(),
      recipient: 'user-id-1',
      sender: 'system',
      data: {},
      readAt: null,
    } as unknown as Notification,
    {
      _id: 'notif-id-2',
      userId: 'user-id-1',
      title: 'Another Notification',
      message: 'This is another notification',
      read: true,
      type: 'INFO',
      createdAt: new Date(),
      recipient: 'user-id-1',
      sender: 'system',
      data: {},
      readAt: new Date(),
    } as unknown as Notification,
  ];

  const mockEvent = {
    _id: 'event-id-1',
    name: 'Test Event',
    organizer: 'organizer-id-1',
    status: 'pending',
    description: 'Test description',
    date: new Date(),
    capacity: 100,
    location: 'Test location',
  } as unknown as EventDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            getNotificationsForUser: jest.fn(),
            getUnreadNotificationsForUser: jest.fn(),
            markNotificationAsRead: jest.fn(),
            markAllNotificationsAsRead: jest.fn(),
            notifyOrganizerAboutEventApproval: jest.fn(),
          },
        },
        {
          provide: EventService,
          useValue: {
            approveEvent: jest.fn(),
            rejectEvent: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            getUserWithRole: jest.fn(),
            hasPermission: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get<NotificationService>(NotificationService);
    eventService = module.get<EventService>(EventService);

    // Mock logger to prevent console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllForCurrentUser', () => {
    it('should return all notifications for current user', async () => {
      jest
        .spyOn(notificationService, 'getNotificationsForUser')
        .mockResolvedValue(mockNotifications as any);

      const req = { user: { userId: 'user-id-1' } };
      const result = await controller.findAllForCurrentUser(req);

      expect(notificationService.getNotificationsForUser).toHaveBeenCalledWith(
        'user-id-1',
      );
      expect(result).toEqual(mockNotifications);
      expect(result.length).toBe(2);
    });
  });

  describe('findUnreadForCurrentUser', () => {
    it('should return unread notifications for current user', async () => {
      const unreadNotifications = [mockNotifications[0]];
      jest
        .spyOn(notificationService, 'getUnreadNotificationsForUser')
        .mockResolvedValue(unreadNotifications as any);

      const req = { user: { userId: 'user-id-1' } };
      const result = await controller.findUnreadForCurrentUser(req);

      expect(
        notificationService.getUnreadNotificationsForUser,
      ).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(unreadNotifications);
      expect(result.length).toBe(1);
      expect(result[0].read).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const updatedNotification = { ...mockNotifications[0], read: true };
      jest
        .spyOn(notificationService, 'markNotificationAsRead')
        .mockResolvedValue(updatedNotification as any);

      const req = { user: { userId: 'user-id-1' } };
      const result = await controller.markAsRead('notif-id-1', req);

      expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith(
        'notif-id-1',
      );
      expect(result).toEqual(updatedNotification);
      expect(result.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for current user', async () => {
      jest
        .spyOn(notificationService, 'markAllNotificationsAsRead')
        .mockResolvedValue();

      const req = { user: { userId: 'user-id-1' } };
      await controller.markAllAsRead(req);

      expect(
        notificationService.markAllNotificationsAsRead,
      ).toHaveBeenCalledWith('user-id-1');
    });
  });

  describe('handleEventApproval', () => {
    it('should approve an event and notify the organizer', async () => {
      const approvedEvent = { ...mockEvent, status: 'approved' };
      const eventApprovalDto: EventApprovalDto = {
        eventId: 'event-id-1',
        approved: true,
      };

      jest
        .spyOn(eventService, 'approveEvent')
        .mockResolvedValue(approvedEvent as any);
      jest
        .spyOn(notificationService, 'notifyOrganizerAboutEventApproval')
        .mockResolvedValue();

      const req = { user: { userId: 'admin-id' } };
      const result = await controller.handleEventApproval(
        eventApprovalDto,
        req,
      );

      expect(eventService.approveEvent).toHaveBeenCalledWith(
        'event-id-1',
        'admin-id',
      );
      expect(
        notificationService.notifyOrganizerAboutEventApproval,
      ).toHaveBeenCalledWith(
        'event-id-1',
        'Test Event',
        'organizer-id-1',
        true,
        undefined,
      );
      expect(result).toEqual({
        success: true,
        message: 'Event approved successfully',
      });
    });

    it('should reject an event with reason and notify the organizer', async () => {
      const rejectedEvent = {
        ...mockEvent,
        status: 'rejected',
        rejectionReason: 'Not appropriate',
      };
      const eventApprovalDto: EventApprovalDto = {
        eventId: 'event-id-1',
        approved: false,
        reason: 'Not appropriate',
      };

      jest
        .spyOn(eventService, 'rejectEvent')
        .mockResolvedValue(rejectedEvent as any);
      jest
        .spyOn(notificationService, 'notifyOrganizerAboutEventApproval')
        .mockResolvedValue();

      const req = { user: { userId: 'admin-id' } };
      const result = await controller.handleEventApproval(
        eventApprovalDto,
        req,
      );

      expect(eventService.rejectEvent).toHaveBeenCalledWith(
        'event-id-1',
        'admin-id',
        'Not appropriate',
      );
      expect(
        notificationService.notifyOrganizerAboutEventApproval,
      ).toHaveBeenCalledWith(
        'event-id-1',
        'Test Event',
        'organizer-id-1',
        false,
        'Not appropriate',
      );
      expect(result).toEqual({
        success: true,
        message: 'Event rejected successfully',
      });
    });

    it('should handle event with complex organizer object', async () => {
      const eventWithComplexOrganizer = {
        ...mockEvent,
        organizer: { _id: 'organizer-id-1', name: 'John Doe' },
        status: 'approved',
      };

      const eventApprovalDto: EventApprovalDto = {
        eventId: 'event-id-1',
        approved: true,
      };

      jest
        .spyOn(eventService, 'approveEvent')
        .mockResolvedValue(eventWithComplexOrganizer as any);
      jest
        .spyOn(notificationService, 'notifyOrganizerAboutEventApproval')
        .mockResolvedValue();

      const req = { user: { userId: 'admin-id' } };
      await controller.handleEventApproval(eventApprovalDto, req);

      expect(
        notificationService.notifyOrganizerAboutEventApproval,
      ).toHaveBeenCalledWith(
        'event-id-1',
        'Test Event',
        'organizer-id-1',
        true,
        undefined,
      );
    });
  });
});
