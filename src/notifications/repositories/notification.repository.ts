import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import { CreateNotificationDto } from '../dtos/create-notification.dto';
import { INotificationRepository } from '../interfaces/notification.repository.interface';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  private readonly logger = new Logger(NotificationRepository.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    this.logger.debug(
      `Creating notification: ${JSON.stringify(createNotificationDto)}`,
    );
    const notification = new this.notificationModel(createNotificationDto);
    return notification.save();
  }

  async findAllByRecipientId(recipientId: string): Promise<Notification[]> {
    this.logger.debug(
      `Finding all notifications for recipient: ${recipientId}`,
    );
    return this.notificationModel
      .find({ recipient: recipientId, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findUnreadByRecipientId(recipientId: string): Promise<Notification[]> {
    this.logger.debug(
      `Finding unread notifications for recipient: ${recipientId}`,
    );
    return this.notificationModel
      .find({ recipient: recipientId, read: false, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string): Promise<Notification> {
    this.logger.debug(`Marking notification as read: ${id}`);
    return this.notificationModel
      .findByIdAndUpdate(id, { read: true, readAt: new Date() }, { new: true })
      .exec();
  }

  async markAllAsReadForUser(recipientId: string): Promise<void> {
    this.logger.debug(
      `Marking all notifications as read for user: ${recipientId}`,
    );
    await this.notificationModel.updateMany(
      { recipient: recipientId, read: false },
      { read: true, readAt: new Date() },
    );
  }

  async deleteNotification(id: string): Promise<void> {
    this.logger.debug(`Soft deleting notification: ${id}`);
    await this.notificationModel
      .findByIdAndUpdate(id, { isActive: false })
      .exec();
  }
}
