import { Notification } from '../schemas/notification.schema';
import { CreateNotificationDto } from '../dtos/create-notification.dto';

export interface INotificationRepository {
  /**
   * Creates a new notification
   * @param createNotificationDto The data to create the notification
   * @returns The created notification
   */
  createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification>;

  /**
   * Finds all active notifications for a recipient
   * @param recipientId The ID of the notification recipient
   * @returns Array of notifications
   */
  findAllByRecipientId(recipientId: string): Promise<Notification[]>;

  /**
   * Finds all unread notifications for a recipient
   * @param recipientId The ID of the notification recipient
   * @returns Array of unread notifications
   */
  findUnreadByRecipientId(recipientId: string): Promise<Notification[]>;

  /**
   * Marks a notification as read
   * @param id The ID of the notification to mark as read
   * @returns The updated notification
   */
  markAsRead(id: string): Promise<Notification>;

  /**
   * Marks all notifications for a user as read
   * @param recipientId The ID of the notification recipient
   */
  markAllAsReadForUser(recipientId: string): Promise<void>;

  /**
   * Soft deletes a notification by marking it as inactive
   * @param id The ID of the notification to delete
   */
  deleteNotification(id: string): Promise<void>;
}
