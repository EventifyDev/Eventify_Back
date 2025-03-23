import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
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
import { PaymentService } from '../providers/payment.service';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { WebhookPayloadDto } from '../dtos/webhook-payload.dto';
import { Payment } from '../schemas/payment.schema';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
    type: Payment,
  })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Payment found',
    type: Payment,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.getPaymentById(id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's payments" })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of payments',
    type: [Payment],
  })
  async getPaymentsByUserId(
    @Param('userId') userId: string,
  ): Promise<Payment[]> {
    return this.paymentService.getPaymentsByUserId(userId);
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payments for an event' })
  @ApiParam({ name: 'eventId', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of payments for the event',
    type: [Payment],
  })
  async getPaymentsByEventId(
    @Param('eventId') eventId: string,
  ): Promise<Payment[]> {
    return this.paymentService.getPaymentsByEventId(eventId);
  }

  // @Post('webhook')
  // @ApiOperation({ summary: 'Webhook endpoint for payment provider' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Webhook processed successfully',
  // })
  // @HttpCode(HttpStatus.OK)
  // async handleWebhook(
  //   @Body() webhookPayloadDto: WebhookPayloadDto,
  // ): Promise<{ received: boolean }> {
  //   await this.paymentService.handleWebhook(webhookPayloadDto);
  //   return { received: true };
  // }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a payment' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Payment canceled',
    type: Payment,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async cancelPayment(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.cancelPayment(id);
  }
}
