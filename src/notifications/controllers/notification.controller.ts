import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  Patch,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationService } from '../providers/notification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Notification } from '../schemas/notification.schema';
import { EventApprovalDto } from '../dtos/event-approval.dto';
import { RequirePermissions } from '../../roles/decorators/permissions.decorator';
import { PermissionsGuard } from '../../roles/guards/permissions.guard';
import { EventService } from '../../event/providers/event.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly eventsService: EventService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of notifications',
    type: [Notification],
  })
  async findAllForCurrentUser(@Req() req): Promise<Notification[]> {
    this.logger.debug(`Getting notifications for user: ${req.user.userId}`);
    return this.notificationService.getNotificationsForUser(req.user.userId);
  }

  @Get('unread')
  @ApiOperation({
    summary: 'Get all unread notifications for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of unread notifications',
    type: [Notification],
  })
  async findUnreadForCurrentUser(@Req() req): Promise<Notification[]> {
    this.logger.debug(
      `Getting unread notifications for user: ${req.user.userId}`,
    );
    return this.notificationService.getUnreadNotificationsForUser(
      req.user.userId,
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: Notification,
  })
  async markAsRead(@Param('id') id: string, @Req() req): Promise<Notification> {
    this.logger.debug(
      `User ${req.user.userId} marking notification ${id} as read`,
    );
    return this.notificationService.markNotificationAsRead(id);
  }

  @Patch('mark-all-read')
  @ApiOperation({
    summary: 'Mark all notifications as read for the current user',
  })
  @ApiResponse({
    status: 204,
    description: 'All notifications marked as read',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@Req() req): Promise<void> {
    this.logger.debug(
      `User ${req.user.userId} marking all notifications as read`,
    );
    return this.notificationService.markAllNotificationsAsRead(req.user.userId);
  }

  @Post('event-approval')
  @RequirePermissions('approve:events')
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Approve or reject an event' })
  @ApiResponse({
    status: 200,
    description:
      'Event approval status updated, notification sent to organizer',
  })
  async handleEventApproval(
    @Body() eventApprovalDto: EventApprovalDto,
    @Req() req,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.debug(
      `Admin ${req.user.userId} ${eventApprovalDto.approved ? 'approving' : 'rejecting'} event ${
        eventApprovalDto.eventId
      }`,
    );

    // Update event status in the events service
    const event = eventApprovalDto.approved
      ? await this.eventsService.approveEvent(
          eventApprovalDto.eventId,
          req.user.userId,
        )
      : await this.eventsService.rejectEvent(
          eventApprovalDto.eventId,
          req.user.userId,
          eventApprovalDto.reason || 'Event rejected by admin',
        );

    const organizerId =
      typeof event.organizer === 'object' && event.organizer?._id
        ? event.organizer._id.toString()
        : String(event.organizer);

    // Notify the organizer
    await this.notificationService.notifyOrganizerAboutEventApproval(
      eventApprovalDto.eventId,
      event.name,
      organizerId,
      eventApprovalDto.approved,
      eventApprovalDto.reason,
    );

    return {
      success: true,
      message: `Event ${eventApprovalDto.approved ? 'approved' : 'rejected'} successfully`,
    };
  }
}
