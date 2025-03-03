import { Injectable, Logger } from '@nestjs/common';
import { MailerConfig } from '../../config/mailer.config';
import { User } from '../../user/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { getRegistrationTemplate } from '../templates/registration.template';
import { getPasswordResetTemplate } from '../templates/password-reset.template';
import { getOtpVerificationTemplate } from '../templates/email-verification.template';
import { getSecurityAlertTemplate } from '../templates/security-alert.template';

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerConfig: MailerConfig,
    private readonly configService: ConfigService,
  ) {
    this.transporter = this.mailerConfig.createTransporter();
    this.logger.log('Email service initialized');
  }

  /**
   * Send welcome email to newly registered users
   */
  async sendRegistrationEmail(user: User): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const mailOptions = {
      from: `"Eventify" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: user.email,
      subject: 'Welcome to Eventify!',
      html: getRegistrationTemplate(user, frontendUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Registration email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send registration email to ${user.email}: ${error.message}`,
      );
      throw new Error(`Error sending registration email: ${error.message}`);
    }
  }

  /**
   * Send password reset email with reset link
   */
  async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetPasswordUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Eventify Security" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: user.email,
      subject: 'Reset Your Password',
      html: getPasswordResetTemplate(user, resetPasswordUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}: ${error.message}`,
      );
      throw new Error(`Error sending password reset email: ${error.message}`);
    }
  }

  /**
   * Send email verification link to new users
   */
  async sendEmailVerificationEmail(user: User, otpCode: string): Promise<void> {
    const mailOptions = {
      from: `"Eventify" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: user.email,
      subject: 'Your Email Verification Code',
      html: getOtpVerificationTemplate(user, otpCode),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email with OTP sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user.email}: ${error.message}`,
      );
      throw new Error(`Error sending verification email: ${error.message}`);
    }
  }

  /**
   * Send security alert for suspicious activities
   */
  async sendSecurityAlertEmail(
    user: User,
    activity: string,
    location: string,
    deviceInfo: string = 'Unknown device',
    ipAddress: string = 'Unknown IP',
  ): Promise<void> {
    const mailOptions = {
      from: `"Eventify Security" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: user.email,
      subject: 'Security Alert: New Account Activity',
      html: getSecurityAlertTemplate(
        user,
        activity,
        location,
        deviceInfo,
        ipAddress,
      ),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Security alert email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send security alert email to ${user.email}: ${error.message}`,
      );
      throw new Error(`Error sending security alert email: ${error.message}`);
    }
  }
}
