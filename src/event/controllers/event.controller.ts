import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from '../providers/event.service';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Event, EventDocument } from '../schemas/event.schema';
import { Participant } from '../../participant/schemas/participant.schema';
import { ParticipantService } from '../../participant/providers/participant.service';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly participantService: ParticipantService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Search events' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [SearchEventResponseDto],
  })
  async search(
    @Query('query') query: string,
  ): Promise<SearchEventResponseDto[]> {
    return this.eventService.search(query);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of events', type: [Event] })
  async findAll(): Promise<Event[]> {
    return this.eventService.findAll();
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user-specific events' })
  async findUserEvents(@Param('userId') userId: string): Promise<Event[]> {
    return this.eventService.findByUserId(userId);
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending events' })
  @ApiResponse({
    status: 200,
    description: 'List of pending events',
    type: [Event],
  })
  async getPendingEvents(): Promise<EventDocument[]> {
    return this.eventService.getPendingEvents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Event found', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findById(@Param('id') id: string): Promise<Event> {
    const event = await this.eventService.findById(id);
    return event;
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve an event' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Event approved', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async approveEvent(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<EventDocument> {
    return this.eventService.approveEvent(id, req.user.userId);
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject an event' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ description: 'Rejection reason', type: String })
  @ApiResponse({ status: 200, description: 'Event rejected', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async rejectEvent(
    @Param('id') id: string,
    @Request() req: any,
    @Body('reason') reason: string,
  ): Promise<EventDocument> {
    return this.eventService.rejectEvent(id, req.user.userId, reason);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created', type: Event })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: any,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<Event> {
    return this.eventService.create(createEventDto, req.user.userId, image);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', type: String })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @ApiResponse({ status: 200, description: 'Event updated', type: Event })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<Event> {
    return this.eventService.update(id, updateEventDto, image);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.eventService.delete(id);
  }

  @Get('organizer/:organizerId')
  @ApiOperation({ summary: "Get organizer's events" })
  @ApiParam({ name: 'organizerId', type: String })
  @ApiResponse({ status: 200, description: 'List of events', type: [Event] })
  async findByOrganizerId(
    @Param('organizerId') organizerId: string,
  ): Promise<Event[]> {
    return this.eventService.findByOrganizerId(organizerId);
  }

  @Get(':eventId/participants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all participants for an event' })
  @ApiResponse({
    status: 200,
    description: 'All participants for an event',
    type: [Participant],
  })
  async getEventParticipants(
    @Param('eventId') eventId: string,
  ): Promise<Participant[]> {
    return this.participantService.getEventParticipants(eventId);
  }
}
