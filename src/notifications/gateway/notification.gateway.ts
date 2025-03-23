import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Notification } from '../schemas/notification.schema';
import { WsJwtGuard } from '../guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userSockets: Map<string, Socket[]> = new Map();

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      this.logger.debug(`Client connected: ${client.id}`);

      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} unauthorized: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.userId;

      if (!userId) {
        this.logger.warn(`Client ${client.id} unauthorized: Invalid token`);
        client.disconnect();
        return;
      }

      // Store connection in the user-socket mapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }

      this.userSockets.get(userId).push(client);
      client.data.userId = userId;

      this.logger.debug(`Client ${client.id} authorized for user ${userId}`);

      // Send acknowledgment to client
      client.emit('connection_established', {
        connected: true,
        userId: userId,
      });
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      const userId = client.data?.userId;
      this.logger.debug(
        `Client disconnected: ${client.id}, userId: ${userId || 'unknown'}`,
      );

      if (userId && this.userSockets.has(userId)) {
        const userClients = this.userSockets.get(userId);
        const remainingClients = userClients.filter((c) => c.id !== client.id);

        if (remainingClients.length === 0) {
          this.userSockets.delete(userId);
          this.logger.debug(`User ${userId} has no more active connections`);
        } else {
          this.userSockets.set(userId, remainingClients);
          this.logger.debug(
            `User ${userId} still has ${remainingClients.length} active connections`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error handling disconnection: ${error.message}`);
    }
  }

  async sendNotificationToUser(
    userId: string,
    notification: Notification,
  ): Promise<boolean> {
    try {
      const userSockets = this.userSockets.get(userId);
      this.logger.debug(
        `Sending notification to user ${userId}, active sockets: ${userSockets?.length || 0}`,
      );

      if (!userSockets || userSockets.length === 0) {
        this.logger.debug(
          `User ${userId} not connected, notification will be delivered when they reconnect`,
        );
        return false;
      }

      // Send to all active connections for this user
      userSockets.forEach((socket) => {
        socket.emit('notification', notification);
      });

      this.logger.debug(`Notification sent to user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
      return false;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ): Promise<WsResponse<any>> {
    try {
      this.logger.debug(`Marking notification as read: ${data.notificationId}`);
      // The actual marking will be handled by the controller

      return {
        event: 'markAsReadResponse',
        data: { success: true, notificationId: data.notificationId },
      };
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      return {
        event: 'markAsReadResponse',
        data: { success: false, error: error.message },
      };
    }
  }
}
