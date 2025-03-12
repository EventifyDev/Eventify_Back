import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationType, Notification } from '../schemas/notification.schema';
import { CreateNotificationDto } from '../dtos/create-notification.dto';
import { NotificationGateway } from '../gateway/notification.gateway';
import { RoleService } from '../../roles/providers/role.service';
import { INotificationService } from '../interfaces/notification.service.interface';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationGateway: NotificationGateway,
    private readonly rolesService: RoleService,
  ) {}

  async createAndSendNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    this.logger.debug('Creating and sending notification');
    const notification = await this.notificationRepository.createNotification(
      createNotificationDto,
    );

    // Send real-time notification via WebSocket
    await this.notificationGateway.sendNotificationToUser(
      createNotificationDto.recipient.toString(),
      notification,
    );

    return notification;
  }

  async notifyAdminsAboutNewEvent(
    eventId: string,
    eventName: string,
    organizerId: string,
  ): Promise<void> {
    this.logger.debug(`Notifying admins about new event: ${eventName}`);

    // Find all admin users
    const adminUsers = await this.rolesService.getUsersByRoleNames([
      'Super Admin',
      'Administrator',
    ]);

    // Create notifications for each admin
    const notificationPromises = adminUsers.map((admin) => {
      const notificationDto: CreateNotificationDto = {
        type: NotificationType.EVENT_CREATED,
        title: 'Nouvel événement créé',
        message: `L'événement "${eventName}" a été créé et nécessite une approbation`,
        recipient: admin._id,
        sender: organizerId,
        data: {
          eventId,
          eventName,
          organizerId,
          requiresApproval: true,
        },
      };

      return this.createAndSendNotification(notificationDto);
    });

    await Promise.all(notificationPromises);
    this.logger.debug(
      `Sent event creation notifications to ${adminUsers.length} admins`,
    );
  }

  async notifyOrganizerAboutEventApproval(
    eventId: string,
    eventName: string,
    organizerId: string,
    approved: boolean,
    reason?: string,
  ): Promise<void> {
    this.logger.debug(
      `Notifying organizer about event ${approved ? 'approval' : 'rejection'}: ${eventName}`,
    );

    const notificationDto: CreateNotificationDto = {
      type: approved
        ? NotificationType.EVENT_APPROVED
        : NotificationType.EVENT_REJECTED,
      title: approved ? 'Événement approuvé' : 'Événement refusé',
      message: approved
        ? `Votre événement "${eventName}" a été approuvé et est maintenant visible publiquement.`
        : `Votre événement "${eventName}" a été refusé. Raison: ${reason || 'Non spécifiée'}`,
      recipient: organizerId,
      data: {
        eventId,
        eventName,
        approved,
        reason,
      },
    };

    await this.createAndSendNotification(notificationDto);
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    this.logger.debug(`Getting notifications for user: ${userId}`);
    return this.notificationRepository.findAllByRecipientId(userId);
  }

  async getUnreadNotificationsForUser(userId: string): Promise<Notification[]> {
    this.logger.debug(`Getting unread notifications for user: ${userId}`);
    return this.notificationRepository.findUnreadByRecipientId(userId);
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    this.logger.debug(`Marking notification as read: ${notificationId}`);
    return this.notificationRepository.markAsRead(notificationId);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    this.logger.debug(`Marking all notifications as read for user: ${userId}`);
    await this.notificationRepository.markAllAsReadForUser(userId);
  }
}
