import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TicketService } from '../providers/ticket.service';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { PurchaseTicketDto } from '../dtos/purchase-ticket.dto';
import { Ticket } from '../schemas/ticket.schema';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({
    status: 201,
    description: 'Ticket created successfully',
    type: Ticket,
  })
  async createTicket(
    @Body() createTicketDto: CreateTicketDto,
  ): Promise<Ticket> {
    return this.ticketService.createTicket(createTicketDto);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all tickets for an event' })
  @ApiParam({ name: 'eventId', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of tickets for the event',
    type: [Ticket],
  })
  async getTicketsByEventId(
    @Param('eventId') eventId: string,
  ): Promise<Ticket[]> {
    return this.ticketService.getTicketsByEventId(eventId);
  }

  @Get('event/:eventId/available')
  @ApiOperation({ summary: 'Get available tickets for an event' })
  @ApiParam({ name: 'eventId', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of available tickets for the event',
    type: [Ticket],
  })
  async getAvailableTicketsForEvent(
    @Param('eventId') eventId: string,
  ): Promise<Ticket[]> {
    return this.ticketService.getAvailableTicketsForEvent(eventId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Ticket updated',
    type: Ticket,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async updateTicket(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket> {
    return this.ticketService.updateTicket(id, updateTicketDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ticket' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Ticket deleted' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicket(@Param('id') id: string): Promise<void> {
    await this.ticketService.deleteTicket(id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a ticket' })
  @ApiResponse({
    status: 200,
    description: 'Ticket purchased successfully',
    type: Ticket,
  })
  async purchaseTicket(
    @Body() purchaseTicketDto: PurchaseTicketDto,
  ): Promise<Ticket> {
    return this.ticketService.purchaseTicket(purchaseTicketDto);
  }
}
