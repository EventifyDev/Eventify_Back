import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerConfig } from '../../config/mailer.config';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('EmailService', () => {
  let service: EmailService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mailerConfig: MailerConfig;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;
  let mockTransporter: any;

  // Mock user object
  const mockUser = {
    _id: 'user-id',
    email: 'test@example.com',
    username: 'testuser',
  };

  beforeEach(async () => {
    // Create a mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    };

    // Create a mock MailerConfig
    const mockMailerConfig = {
      createTransporter: jest.fn().mockReturnValue(mockTransporter),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerConfig,
          useValue: mockMailerConfig,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const configValues = {
                FRONTEND_URL: 'https://eventify.example.com',
                MAIL_FROM: 'noreply@eventify.example.com',
              };
              return configValues[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerConfig = module.get<MailerConfig>(MailerConfig);
    configService = module.get<ConfigService>(ConfigService);

    // Mock logger to prevent console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendRegistrationEmail', () => {
    it('should send a registration email to the user', async () => {
      await service.sendRegistrationEmail(mockUser as any);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('noreply@eventify.example.com'),
          to: mockUser.email,
          subject: 'Welcome to Eventify!',
          html: expect.any(String),
        }),
      );
    });

    it('should throw an error if sending the email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        service.sendRegistrationEmail(mockUser as any),
      ).rejects.toThrow('Error sending registration email: SMTP error');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email to the user', async () => {
      const resetToken = 'mock-reset-token';
      await service.sendPasswordResetEmail(mockUser as any, resetToken);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('noreply@eventify.example.com'),
          to: mockUser.email,
          subject: 'Reset Your Password',
          html: expect.stringContaining(resetToken),
        }),
      );
    });

    it('should throw an error if sending the email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        service.sendPasswordResetEmail(mockUser as any, 'token'),
      ).rejects.toThrow('Error sending password reset email: SMTP error');
    });
  });

  describe('sendEmailVerificationEmail', () => {
    it('should send an email with OTP verification code', async () => {
      const otpCode = '123456';
      await service.sendEmailVerificationEmail(mockUser as any, otpCode);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('noreply@eventify.example.com'),
          to: mockUser.email,
          subject: 'Your Email Verification Code',
          html: expect.stringContaining(otpCode),
        }),
      );
    });

    it('should throw an error if sending the email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        service.sendEmailVerificationEmail(mockUser as any, '123456'),
      ).rejects.toThrow('Error sending verification email: SMTP error');
    });
  });

  describe('sendSecurityAlertEmail', () => {
    it('should send a security alert email with activity details', async () => {
      const activity = 'login';
      const location = 'Paris, France';
      const deviceInfo = 'Chrome on Windows';
      const ipAddress = '192.168.1.1';

      await service.sendSecurityAlertEmail(
        mockUser as any,
        activity,
        location,
        deviceInfo,
        ipAddress,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('noreply@eventify.example.com'),
          to: mockUser.email,
          subject: 'Security Alert: New Account Activity',
          html: expect.stringContaining(activity),
        }),
      );
    });

    it('should use default values if device and IP are not provided', async () => {
      const activity = 'password change';
      const location = 'Unknown';

      await service.sendSecurityAlertEmail(mockUser as any, activity, location);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          subject: 'Security Alert: New Account Activity',
          html: expect.stringContaining('Unknown device'),
        }),
      );
    });

    it('should throw an error if sending the email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        service.sendSecurityAlertEmail(mockUser as any, 'login', 'Paris'),
      ).rejects.toThrow('Error sending security alert email: SMTP error');
    });
  });

  describe('sendPasswordChangeConfirmationEmail', () => {
    it('should send a password change confirmation email', async () => {
      await service.sendPasswordChangeConfirmationEmail(mockUser as any);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('noreply@eventify.example.com'),
          to: mockUser.email,
          subject: 'Your Password Has Been Changed',
          html: expect.any(String),
        }),
      );
    });

    it('should throw an error if sending the email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        service.sendPasswordChangeConfirmationEmail(mockUser as any),
      ).rejects.toThrow('Error sending confirmation email: SMTP error');
    });
  });

  describe('sendDeviceVerificationEmail', () => {
    it('should send a device verification email with OTP code', async () => {
      const otpCode = '123456';
      const deviceInfo = {
        browser: 'Chrome',
        os: 'Windows',
        ip: '192.168.1.1',
      };

      await service.sendDeviceVerificationEmail(
        mockUser as any,
        otpCode,
        deviceInfo,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('noreply@eventify.example.com'),
          to: mockUser.email,
          subject: 'Verify Your Device - Eventify Security Alert',
          html: expect.stringContaining(otpCode),
        }),
      );
    });

    it('should throw an error if sending the email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));
      const deviceInfo = {
        browser: 'Chrome',
        os: 'Windows',
        ip: '192.168.1.1',
      };

      await expect(
        service.sendDeviceVerificationEmail(
          mockUser as any,
          '123456',
          deviceInfo,
        ),
      ).rejects.toThrow('Error sending device verification email: SMTP error');
    });
  });
});
