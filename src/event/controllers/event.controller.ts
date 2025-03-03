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
<<<<<<< HEAD
  UseFilters,
=======
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from '../providers/event.service';
import { CreateEventDto } from '../dtos/create-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Event } from '../schemas/event.schema';
import { Participant } from '../../participant/schemas/participant.schema';
import { ParticipantService } from '../../participant/providers/participant.service';
import { SearchEventResponseDto } from '../dtos/search-event.response.dto';
<<<<<<< HEAD
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';

@ApiTags('Events')
@Controller('events')
@UseFilters(HttpExceptionFilter)
=======

@ApiTags('Events')
@Controller('events')
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
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
<<<<<<< HEAD
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    events: SearchEventResponseDto[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    return this.eventService.search(query, page, limit);
  }

  @Get('')
=======
  ): Promise<SearchEventResponseDto[]> {
    return this.eventService.search(query);
  }

  @Get('user/:userId')
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all events with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of events', type: [Event] })
<<<<<<< HEAD
  async findAllEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    events: Event[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    return this.eventService.findAllEvents(page, limit);
  }
  @Get('popular')
  @ApiOperation({ summary: 'Get popular events' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of popular events',
    type: [Event],
  })
  async findPopularEvents(@Query('limit') limit?: number): Promise<Event[]> {
    return this.eventService.findPopularEvents(limit);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming events',
    type: [Event],
  })
  async findUpcomingEvents(@Query('limit') limit?: number): Promise<Event[]> {
    return this.eventService.findUpcomingEvents(limit);
  }

  @Get('organizer/:userId/events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all events for an organizer with pagination' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of events by organizer',
    type: [Event],
  })
  async findAllByOrganizer(
=======
  async findAll(
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<Event[]> {
<<<<<<< HEAD
    return this.eventService.findAllByOrganizer(userId, page, limit);
=======
    return this.eventService.findAll(userId, page, limit);
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Event found', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findById(@Param('id') id: string): Promise<Event> {
<<<<<<< HEAD
    const event = await this.eventService.findById(id);
=======
    console.log('id', id);
    const event = await this.eventService.findById(id);
    console.log('event', event);
>>>>>>> 9c4cbafcb081eb83d78a63f740b275a5f86832b1
    return event;
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
    return this.eventService.create(createEventDto, req.user.id, image);
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
  async delete(@Param('id') id: string): Promise<boolean> {
    return this.eventService.delete(id);
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
