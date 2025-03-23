import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IPaymentService } from '../interfaces/payment.service.interface';
import { PaymentRepository } from '../repositories/payment.repository';
import { MollieService } from './mollie.service';
import { Payment } from '../schemas/payment.schema';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { WebhookPayloadDto } from '../dtos/webhook-payload.dto';
import { PaymentStatus } from '../enums/payment-status.enum';
import { TicketService } from '../../ticket/providers/ticket.service';

@Injectable()
export class PaymentService implements IPaymentService {
  private readonly logger = new Logger('PaymentService');

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly mollieService: MollieService,
    private readonly ticketService: TicketService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const {
      ticketId,
      userId,
      quantity = 1,
      redirectUrl,
      metadata = {},
    } = createPaymentDto;

    // Get ticket information
    const ticket = await this.ticketService.getTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Check if ticket is available
    if (ticket.status !== 'AVAILABLE') {
      throw new BadRequestException('Ticket is not available for purchase');
    }

    // Check if enough tickets are available
    if (ticket.soldQuantity + quantity > ticket.quantity) {
      throw new BadRequestException('Not enough tickets available');
    }

    // Calculate total amount
    const totalAmount = ticket.price * quantity;

    // Create a payment reference
    const paymentReference = `EVENTIFY-${uuidv4().substring(0, 8)}`;
    const description = `Ticket purchase for ${ticket.type} - ${paymentReference}`;

    // Create payment in Mollie
    const molliePayment = await this.mollieService.createPayment(
      totalAmount,
      description,
      redirectUrl,
      {
        ...metadata,
        ticketId,
        userId,
        quantity,
        eventId: ticket.event,
      },
    );

    // Create payment record in database
    const payment = await this.paymentRepository.create({
      paymentId: paymentReference,
      ticketId,
      userId,
      eventId: ticket.event,
      amount: totalAmount,
      currency: 'EUR',
      description,
      status: PaymentStatus.PENDING,
      provider: 'mollie',
      providerTransactionId: molliePayment.id,
      checkoutUrl: molliePayment.checkoutUrl,
      redirectUrl,
      webhookUrl: `${process.env.APP_URL}/api/payments/webhook`,
      metadata: {
        ...metadata,
        quantity,
      },
      expiresAt: molliePayment.expiresAt
        ? new Date(molliePayment.expiresAt)
        : undefined,
    });

    return payment;
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return this.paymentRepository.findByUserId(userId);
  }

  async getPaymentsByEventId(eventId: string): Promise<Payment[]> {
    return this.paymentRepository.findByEventId(eventId);
  }

  // async handleWebhook(webhookPayloadDto: WebhookPayloadDto): Promise<void> {
  //   const { id: molliePaymentId } = webhookPayloadDto;

  //   // Get the payment details from Mollie
  //   const molliePayment = await this.mollieService.getPayment(molliePaymentId);
  //   if (!molliePayment) {
  //     this.logger.error(
  //       `Webhook received for non-existent payment: ${molliePaymentId}`,
  //     );
  //     return;
  //   }

  //   // Find the corresponding payment in our database
  //   const payment =
  //     await this.paymentRepository.findByProviderTransactionId(molliePaymentId);
  //   if (!payment) {
  //     this.logger.error(
  //       `Payment not found for Mollie transaction ID: ${molliePaymentId}`,
  //     );
  //     return;
  //   }

  //   // Update the payment status based on the Mollie payment status
  //   await this.paymentRepository.updateStatus(
  //     payment._id,
  //     molliePayment.status,
  //     {
  //       paidAt: molliePayment.paidAt
  //         ? new Date(molliePayment.paidAt)
  //         : undefined,
  //       canceledAt: molliePayment.canceledAt
  //         ? new Date(molliePayment.canceledAt)
  //         : undefined,
  //     },
  //   );

  //   // If payment is successful, update the ticket status
  //   if (molliePayment.status === PaymentStatus.PAID) {
  //     try {
  //       // Get the ticket quantity from the payment metadata
  //       const quantity = payment.metadata?.quantity || 1;

  //       // Purchase the ticket
  //       await this.ticketService.purchaseTicket({
  //         ticketId: payment.ticketId,
  //         userId: payment.userId,
  //         quantity,
  //       });

  //       this.logger.log(
  //         `Ticket ${payment.ticketId} purchased successfully for user ${payment.userId}`,
  //       );
  //     } catch (error) {
  //       this.logger.error(
  //         `Failed to update ticket status: ${error.message}`,
  //         error.stack,
  //       );
  //     }
  //   }
  // }

  async cancelPayment(id: string): Promise<Payment> {
    const payment = await this.getPaymentById(id);

    // Check if payment can be canceled
    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Cannot cancel a payment that has already been paid',
      );
    }

    if (payment.status === PaymentStatus.CANCELED) {
      return payment;
    }

    const canceledPayment = await this.mollieService.cancelPayment(
      payment.providerTransactionId,
    );

    return this.paymentRepository.updateStatus(id, PaymentStatus.CANCELED, {
      canceledAt: canceledPayment.canceledAt
        ? new Date(canceledPayment.canceledAt)
        : new Date(),
    });
  }
}
