import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationGateway } from '../gateway/notification.gateway';
import { RoleService } from '../../roles/providers/role.service';
import { Logger } from '@nestjs/common';
import { Notification } from '../schemas/notification.schema';
import { CreateNotificationDto } from '../dtos/create-notification.dto';
import { NotificationType } from '../enums/notification-type.enum';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: NotificationRepository;
  let notificationGateway: NotificationGateway;
  let rolesService: RoleService;

  const mockNotification = {
    _id: 'notif-id-1',
    type: NotificationType.SYSTEM,
    title: 'Test Notification',
    message: 'Test message',
    recipient: 'user-id-1',
    sender: 'system',
    read: false,
    data: {},
    createdAt: new Date(),
  } as unknown as Notification;

  const mockCreateNotificationDto: CreateNotificationDto = {
    type: NotificationType.SYSTEM,
    title: 'Test Notification',
    message: 'Test message',
    recipient: 'user-id-1',
    sender: 'system',
    data: {},
  };

  const mockAdminUsers = [
    { _id: 'admin-id-1', username: 'admin1', email: 'admin1@example.com' },
    { _id: 'admin-id-2', username: 'admin2', email: 'admin2@example.com' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: {
            createNotification: jest.fn(),
            findAllByRecipientId: jest.fn(),
            findUnreadByRecipientId: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsReadForUser: jest.fn(),
          },
        },
        {
          provide: NotificationGateway,
          useValue: {
            sendNotificationToUser: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            getUsersByRoleNames: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get<NotificationRepository>(
      NotificationRepository,
    );
    notificationGateway = module.get<NotificationGateway>(NotificationGateway);
    rolesService = module.get<RoleService>(RoleService);

    // Mock logger to prevent console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAndSendNotification', () => {
    it('should create a notification and send it via WebSocket', async () => {
      jest
        .spyOn(notificationRepository, 'createNotification')
        .mockResolvedValue(mockNotification);
      jest
        .spyOn(notificationGateway, 'sendNotificationToUser')
        .mockResolvedValue(undefined);

      const result = await service.createAndSendNotification(
        mockCreateNotificationDto,
      );

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        mockCreateNotificationDto,
      );
      expect(notificationGateway.sendNotificationToUser).toHaveBeenCalledWith(
        mockCreateNotificationDto.recipient.toString(),
        mockNotification,
      );
      expect(result).toEqual(mockNotification);
    });
  });

  describe('notifyAdminsAboutNewEvent', () => {
    it('should notify all admin users about a new event', async () => {
      jest
        .spyOn(rolesService, 'getUsersByRoleNames')
        .mockResolvedValue(mockAdminUsers as any);
      jest
        .spyOn(service, 'createAndSendNotification')
        .mockResolvedValue(mockNotification);

      await service.notifyAdminsAboutNewEvent(
        'event-id-1',
        'Test Event',
        'organizer-id-1',
      );

      expect(rolesService.getUsersByRoleNames).toHaveBeenCalledWith([
        'Super Admin',
        'Administrator',
      ]);
      expect(service.createAndSendNotification).toHaveBeenCalledTimes(2);

      // Verify notification for first admin
      expect(service.createAndSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.EVENT_CREATED,
          title: 'New event created',
          recipient: 'admin-id-1',
          sender: 'organizer-id-1',
          data: expect.objectContaining({
            eventId: 'event-id-1',
            eventName: 'Test Event',
          }),
        }),
      );
    });

    it('should handle empty admin list gracefully', async () => {
      jest.spyOn(rolesService, 'getUsersByRoleNames').mockResolvedValue([]);
      jest
        .spyOn(service, 'createAndSendNotification')
        .mockResolvedValue(mockNotification);

      await service.notifyAdminsAboutNewEvent(
        'event-id-1',
        'Test Event',
        'organizer-id-1',
      );

      expect(service.createAndSendNotification).not.toHaveBeenCalled();
    });
  });

  describe('notifyOrganizerAboutEventApproval', () => {
    it('should send approval notification to organizer', async () => {
      jest
        .spyOn(service, 'createAndSendNotification')
        .mockResolvedValue(mockNotification);

      await service.notifyOrganizerAboutEventApproval(
        'event-id-1',
        'Test Event',
        'organizer-id-1',
        true,
      );

      expect(service.createAndSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.EVENT_APPROVED,
          title: 'Event approved',
          recipient: 'organizer-id-1',
          data: expect.objectContaining({
            eventId: 'event-id-1',
            eventName: 'Test Event',
            approved: true,
          }),
        }),
      );
    });

    it('should send rejection notification with reason to organizer', async () => {
      jest
        .spyOn(service, 'createAndSendNotification')
        .mockResolvedValue(mockNotification);

      await service.notifyOrganizerAboutEventApproval(
        'event-id-1',
        'Test Event',
        'organizer-id-1',
        false,
        'Not appropriate content',
      );

      expect(service.createAndSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.EVENT_REJECTED,
          title: 'Event rejected',
          recipient: 'organizer-id-1',
          data: expect.objectContaining({
            eventId: 'event-id-1',
            eventName: 'Test Event',
            approved: false,
            reason: 'Not appropriate content',
          }),
        }),
      );
    });
  });

  describe('getNotificationsForUser', () => {
    it('should return all notifications for a user', async () => {
      const mockNotifications = [
        mockNotification,
        { ...mockNotification, _id: 'notif-id-2' },
      ];
      jest
        .spyOn(notificationRepository, 'findAllByRecipientId')
        .mockResolvedValue(mockNotifications as any);

      const result = await service.getNotificationsForUser('user-id-1');

      expect(notificationRepository.findAllByRecipientId).toHaveBeenCalledWith(
        'user-id-1',
      );
      expect(result).toEqual(mockNotifications);
      expect(result.length).toBe(2);
    });
  });

  describe('getUnreadNotificationsForUser', () => {
    it('should return unread notifications for a user', async () => {
      const mockUnreadNotifications = [mockNotification];
      jest
        .spyOn(notificationRepository, 'findUnreadByRecipientId')
        .mockResolvedValue(mockUnreadNotifications as any);

      const result = await service.getUnreadNotificationsForUser('user-id-1');

      expect(
        notificationRepository.findUnreadByRecipientId,
      ).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(mockUnreadNotifications);
      expect(result.length).toBe(1);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      const readNotification = { ...mockNotification, read: true };
      jest
        .spyOn(notificationRepository, 'markAsRead')
        .mockResolvedValue(readNotification as any);

      const result = await service.markNotificationAsRead('notif-id-1');

      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(
        'notif-id-1',
      );
      expect(result.read).toBe(true);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      jest
        .spyOn(notificationRepository, 'markAllAsReadForUser')
        .mockResolvedValue();

      await service.markAllNotificationsAsRead('user-id-1');

      expect(notificationRepository.markAllAsReadForUser).toHaveBeenCalledWith(
        'user-id-1',
      );
    });
  });
});
