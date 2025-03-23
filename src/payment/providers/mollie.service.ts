import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createMollieClient,
  PaymentStatus as MolliePaymentStatus,
} from '@mollie/api-client';
import { PaymentStatus } from '../enums/payment-status.enum';

@Injectable()
export class MollieService {
  private readonly mollieClient;
  private readonly baseUrl: string;
  private readonly logger = new Logger('MollieService');

  constructor(private readonly configService: ConfigService) {
    this.mollieClient = createMollieClient({
      apiKey: this.configService.get<string>('MOLLIE_API_KEY'),
    });
    this.baseUrl = this.configService.get<string>('APP_URL');
  }

  async createPayment(
    amount: number,
    description: string,
    redirectUrl: string,
    metadata: Record<string, any>,
  ) {
    try {
      const payment = await this.mollieClient.payments.create({
        amount: {
          currency: 'EUR',
          value: amount.toFixed(2),
        },
        description,
        redirectUrl,
        webhookUrl: `${this.baseUrl}/api/payments/webhook`,
        metadata,
      });

      return {
        id: payment.id,
        status: this.mapMollieStatusToPaymentStatus(payment.status),
        checkoutUrl: payment._links.checkout.href,
        expiresAt: payment.expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create Mollie payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getPayment(paymentId: string) {
    try {
      const payment = await this.mollieClient.payments.get(paymentId);

      return {
        id: payment.id,
        status: this.mapMollieStatusToPaymentStatus(payment.status),
        amount: payment.amount.value,
        description: payment.description,
        metadata: payment.metadata,
        paidAt: payment.paidAt,
        canceledAt: payment.canceledAt,
        expiresAt: payment.expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get Mollie payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async cancelPayment(paymentId: string) {
    try {
      const payment = await this.mollieClient.payments.cancel(paymentId);
      return {
        id: payment.id,
        status: this.mapMollieStatusToPaymentStatus(payment.status),
        canceledAt: payment.canceledAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to cancel Mollie payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private mapMollieStatusToPaymentStatus(mollieStatus: string): PaymentStatus {
    switch (mollieStatus) {
      case MolliePaymentStatus.paid:
        return PaymentStatus.PAID;
      case MolliePaymentStatus.canceled:
        return PaymentStatus.CANCELED;
      case MolliePaymentStatus.expired:
        return PaymentStatus.EXPIRED;
      case MolliePaymentStatus.failed:
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
