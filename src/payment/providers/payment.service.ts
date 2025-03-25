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

    const ticket = await this.ticketService.getTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    if (ticket.status !== 'AVAILABLE') {
      throw new BadRequestException('Ticket is not available for purchase');
    }

    if (ticket.soldQuantity + quantity > ticket.quantity) {
      throw new BadRequestException('Not enough tickets available');
    }

    const totalAmount = ticket.price * quantity;

    const paymentReference = `EVENTIFY-${uuidv4().substring(0, 8)}`;
    const description = `Ticket purchase for ${ticket.type} - ${paymentReference}`;

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

    const payment = await this.paymentRepository.create({
      paymentId: paymentReference,
      ticketId,
      userId,
      eventId: ticket.event,
      amount: totalAmount,
      status: PaymentStatus.PENDING,
      providerTransactionId: molliePayment.id,
      checkoutUrl: molliePayment.checkoutUrl,
      redirectUrl,
      metadata: {
        ...metadata,
        quantity,
      },
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

    await this.mollieService.cancelPayment(payment.providerTransactionId);

    return this.paymentRepository.updateStatus(id, PaymentStatus.CANCELED);
  }
}
