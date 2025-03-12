import { Notification } from '../schemas/notification.schema';
import { CreateNotificationDto } from '../dtos/create-notification.dto';

export interface INotificationService {
  /**
   * Creates a notification in the database and sends it in real-time via WebSockets
   * @param createNotificationDto Data to create the notification
   * @returns The created notification
   */
  createAndSendNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification>;

  /**
   * Notifies all administrators about a newly created event that requires approval
   * @param eventId ID of the created event
   * @param eventName Name of the event
   * @param organizerId ID of the user who created the event
   */
  notifyAdminsAboutNewEvent(
    eventId: string,
    eventName: string,
    organizerId: string,
  ): Promise<void>;

  /**
   * Notifies an event organizer about the approval status of their event
   * @param eventId ID of the event
   * @param eventName Name of the event
   * @param organizerId ID of the event organizer
   * @param approved Whether the event was approved or rejected
   * @param reason Optional reason for rejection
   */
  notifyOrganizerAboutEventApproval(
    eventId: string,
    eventName: string,
    organizerId: string,
    approved: boolean,
    reason?: string,
  ): Promise<void>;

  /**
   * Retrieves all notifications for a specific user
   * @param userId ID of the user
   * @returns Array of notifications
   */
  getNotificationsForUser(userId: string): Promise<Notification[]>;

  /**
   * Retrieves only unread notifications for a specific user
   * @param userId ID of the user
   * @returns Array of unread notifications
   */
  getUnreadNotificationsForUser(userId: string): Promise<Notification[]>;

  /**
   * Marks a specific notification as read
   * @param notificationId ID of the notification to mark as read
   * @returns The updated notification
   */
  markNotificationAsRead(notificationId: string): Promise<Notification>;

  /**
   * Marks all notifications for a specific user as read
   * @param userId ID of the user
   */
  markAllNotificationsAsRead(userId: string): Promise<void>;
}
