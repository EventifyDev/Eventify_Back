import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateParticipantDto } from '../dtos/create-participant.dto';
import { UpdateParticipantDto } from '../dtos/update-participant.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Participant } from '../schemas/participant.schema';
import { ParticipantService } from '../providers/participant.service';

@ApiTags('participants')
@Controller('participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register for an event' })
  @ApiResponse({
    status: 201,
    description: 'Participant registered successfully',
    type: Participant,
  })
  async register(
    @Body() createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    return this.participantService.register(createParticipantDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update participant information' })
  @ApiResponse({
    status: 200,
    description: 'Participant information updated successfully',
    type: Participant,
  })
  async update(
    @Param('id') id: string,
    @Body() updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    return this.participantService.update(id, updateParticipantDto);
  }

  @Get('event/:eventId')
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel participation in event' })
  @ApiResponse({
    status: 200,
    description: 'Participation canceled successfully',
    type: Boolean,
  })
  async cancelParticipation(@Param('id') id: string): Promise<boolean> {
    return this.participantService.cancelParticipation(id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get participant count for an event' })
  @ApiResponse({
    status: 200,
    description: 'Participant count for an event',
    type: Number,
  })
  async getParticipantCount(
    @Query('eventId') eventId?: string,
  ): Promise<number> {
    return this.participantService.getParticipantCount(eventId);
  }
}
