import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/providers/user.service';
import { EmailService } from './email.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { User } from '../../user/schemas/user.schema';
import * as crypto from 'crypto';
import { VerifyDeviceDto } from '../dtos/verify-device.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('AuthService initialized');
  }

  async validateUser(email: string, password: string): Promise<any> {
    this.logger.debug(`Attempting to validate user: ${email}`);
    const user = await this.userService.findUserByEmailWithPassword(email);
    this.logger.debug(`User found: ${!!user}`);

    if (!user?.password) {
      this.logger.warn(
        `User not found or password not set for email: ${email}`,
      );
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    this.logger.debug(`Password validation result: ${isPasswordValid}`);

    if (isPasswordValid) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toObject ? user.toObject() : user;
      return result;
    }

    this.logger.warn(`Invalid password for email: ${email}`);
    return null;
  }

  async login(loginDto: LoginDto, res: Response, req: Request) {
    this.logger.debug(`Login attempt for email: ${loginDto.email}`);

    // Validate user credentials
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.warn(`Login failed for email: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate a device fingerprint from the request
    const deviceFingerprint = this.generateDeviceFingerprint(req);
    this.logger.debug(
      `Device fingerprint generated for login: ${deviceFingerprint.substring(0, 8)}...`,
    );

    // Check if this device has been previously verified
    const isKnownDevice = await this.checkKnownDevice(
      user._id,
      deviceFingerprint,
    );

    // If device is already verified, proceed with normal login
    if (isKnownDevice) {
      this.logger.debug(
        `Known device for userId: ${user._id}, proceeding with login`,
      );
      return this.completeLogin(user, res);
    }

    // For new devices, generate and send OTP
    this.logger.debug(
      `New device detected for userId: ${user._id}, requiring verification`,
    );

    // Generate OTP code
    const otpCode = this.generateDeterministicOtp(
      user._id.toString(),
      user.email,
      Date.now(), // Use current time to ensure uniqueness
    );

    // Store verification data
    await this.userService.updateUser(user._id, {
      deviceVerificationOtp: otpCode,
      deviceVerificationOtpCreatedAt: new Date(),
      pendingDeviceFingerprint: deviceFingerprint,
    });

    // Send verification email with device info
    try {
      const deviceInfo = this.getDeviceInfo(req);
      await this.emailService.sendDeviceVerificationEmail(
        user,
        otpCode,
        deviceInfo,
      );
      this.logger.debug(`Device verification email sent to ${user.email}`);
    } catch (emailError) {
      this.logger.error(
        `Failed to send device verification email: ${emailError.message}`,
        emailError.stack,
      );
    }

    // Return partial response indicating verification needed
    return {
      requiresDeviceVerification: true,
      email: user.email,
      message: 'Device verification required',
    };
  }

  private async completeLogin(user: any, res: Response) {
    const { accessToken, refreshToken } = await this.generateTokens(user);
    this.logger.debug(`Tokens generated for userId: ${user._id}`);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateUser(user._id, {
      refreshToken: hashedRefreshToken,
    });
    this.logger.debug(`Refresh token stored for userId: ${user._id}`);

    this.setTokenCookies(res, accessToken, refreshToken);
    this.logger.debug(`Token cookies set for userId: ${user._id}`);

    return {
      accessToken,
      refreshToken,
      userId: user._id,
      email: user.email,
    };
  }
  private generateDeviceFingerprint(req: Request): string {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || '';
    const acceptLanguage = req.headers['accept-language'] || '';

    const deviceData = `${userAgent}:${ip}:${acceptLanguage}`;
    return crypto.createHash('sha256').update(deviceData).digest('hex');
  }

  private async checkKnownDevice(
    userId: string,
    deviceFingerprint: string,
  ): Promise<boolean> {
    const user = await this.userService.getUser({ _id: userId });
    if (!user || !user.verifiedDevices) {
      return false;
    }

    return user.verifiedDevices.includes(deviceFingerprint);
  }

  private getDeviceInfo(req: Request): {
    browser: string;
    os: string;
    ip: string;
  } {
    const userAgent = req.headers['user-agent'] || '';

    let browser = 'Unknown browser';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let os = 'Unknown OS';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'Mac OS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad'))
      os = 'iOS';

    return {
      browser,
      os,
      ip: req.ip || 'Unknown IP',
    };
  }

  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    this.logger.debug(`Registration attempt for email: ${registerDto.email}`);

    try {
      const user = await this.userService.createUser(registerDto);
      this.logger.debug(`User created with ID: ${user._id}`);

      // Generate OTP using crypto for proper deterministic hashing
      const otpCode = this.generateDeterministicOtp(
        user._id.toString(),
        user.email,
        user.createdAt.getTime(),
      );

      await this.userService.updateUser(user._id, {
        isEmailVerified: false,
        otpCreatedAt: new Date(),
      });

      try {
        // Send verification email with OTP
        await this.emailService.sendEmailVerificationEmail(user, otpCode);
        this.logger.debug(`Verification email with OTP sent to ${user.email}`);
      } catch (emailError) {
        this.logger.error(
          `Failed to send verification email: ${emailError.message}`,
          emailError.stack,
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user.toObject
        ? user.toObject()
        : user;

      return userWithoutPassword;
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.warn(`Conflict during registration: ${error.message}`);
        throw new BadRequestException(error.message);
      }
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Registration failed. Please try again later.',
      );
    }
  }

  async refreshTokens(userId: string, refreshToken: string, res: Response) {
    this.logger.debug(`Refreshing tokens for userId: ${userId}`);

    const user = await this.userService.getUser({ _id: userId });
    if (!user || !user.refreshToken) {
      this.logger.warn(`No user or refresh token found for userId: ${userId}`);
      throw new UnauthorizedException('Access denied');
    }

    // Verify the refresh token
    this.logger.debug(`Verifying refresh token for userId: ${userId}`);
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      this.logger.warn(`Invalid refresh token for userId: ${userId}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    this.logger.debug(`Generating new tokens for userId: ${userId}`);
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(user);

    // Store new hashed refresh token
    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await this.userService.updateUser(user._id, {
      refreshToken: hashedRefreshToken,
    });
    this.logger.debug(`New refresh token stored for userId: ${userId}`);

    // Set new cookies
    this.setTokenCookies(res, accessToken, newRefreshToken);
    this.logger.debug(`New token cookies set for userId: ${userId}`);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, res: Response) {
    this.logger.debug(`Logging out userId: ${userId}`);

    await this.userService.updateUser({ _id: userId }, { refreshToken: null });
    this.logger.debug(`Refresh token cleared for userId: ${userId}`);

    res.clearCookie('Authentication');
    res.clearCookie('Refresh');
    this.logger.debug(`Authentication cookies cleared for userId: ${userId}`);

    return { success: true };
  }

  async verifyUserRefreshToken(refreshToken: string, userId: string) {
    this.logger.debug(`Verifying refresh token for userId: ${userId}`);

    try {
      const user = await this.userService.getUser({ _id: userId });
      if (!user || !user.refreshToken) {
        this.logger.warn(
          `User not found or no refresh token stored for userId: ${userId}`,
        );
        throw new NotFoundException(
          'User not found or no refresh token stored',
        );
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!refreshTokenMatches) {
        this.logger.warn(`Invalid refresh token for userId: ${userId}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      this.logger.debug(`Refresh token verified for userId: ${userId}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Refresh token verification failed: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Refresh token is not valid');
    }
  }
  async verifyOtp(email: string, otpCode: string): Promise<boolean> {
    this.logger.debug(`OTP verification attempt for email: ${email}`);

    try {
      // Find user by email
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        this.logger.warn(`User not found for OTP verification: ${email}`);
        throw new NotFoundException('User not found');
      }

      // Check if email is already verified - MODIFIED THIS PART
      if (user.isEmailVerified) {
        this.logger.debug(`Email already verified for user: ${email}`);
        throw new BadRequestException('Email is already verified');
      }

      // Ensure OTP creation time exists
      if (!user.otpCreatedAt) {
        this.logger.warn(`No OTP timestamp found for user: ${email}`);
        throw new UnauthorizedException(
          'Verification code not found. Please request a new one.',
        );
      }

      // Check if OTP has expired (1 minute)
      const otpExpirationTime = 1 * 60 * 1000;
      const currentTime = new Date().getTime();
      const otpCreatedTime = new Date(user.otpCreatedAt).getTime();

      // Log the expiration check details for debugging
      this.logger.debug(
        `OTP time check - Current: ${currentTime}, Created: ${otpCreatedTime}, Diff: ${
          currentTime - otpCreatedTime
        }, Expiration: ${otpExpirationTime}`,
      );

      if (currentTime - otpCreatedTime > otpExpirationTime) {
        this.logger.warn(`OTP expired for user: ${email}`);
        throw new UnauthorizedException(
          'Verification code has expired. Please request a new one.',
        );
      }

      // Generate expected OTP using deterministic method
      const expectedOtp = this.generateDeterministicOtp(
        user._id.toString(),
        user.email,
        user.createdAt.getTime(),
      );

      // Debug OTP values
      this.logger.debug(
        `Expected OTP: ${expectedOtp}, Received OTP: ${otpCode}`,
      );

      // Validate OTP
      if (otpCode !== expectedOtp) {
        this.logger.warn(`Invalid OTP provided for user: ${email}`);
        throw new UnauthorizedException('Invalid verification code');
      }

      // Update user as verified and clear OTP timestamp
      await this.userService.updateUser(user._id, {
        isEmailVerified: true,
        otpCreatedAt: null,
      });

      this.logger.debug(`Email verified via OTP for user: ${email}`);

      // Send welcome email after successful verification
      try {
        await this.emailService.sendRegistrationEmail(user);
        this.logger.debug(`Registration welcome email sent to ${user.email}`);
      } catch (emailError) {
        this.logger.error(
          `Failed to send registration welcome email: ${emailError.message}`,
          emailError.stack,
        );
      }

      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log and wrap other errors
      this.logger.error(
        `OTP verification failed: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Invalid or expired verification code');
    }
  }

  async verifyDevice(
    verifyDeviceDto: VerifyDeviceDto,
    res: Response,
  ): Promise<any> {
    const { email, otpCode } = verifyDeviceDto;
    this.logger.debug(`Device verification attempt for email: ${email}`);

    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deviceVerificationOtp || !user.pendingDeviceFingerprint) {
      throw new BadRequestException('No pending device verification');
    }

    // Check OTP expiration (10 minutes)
    if (user.deviceVerificationOtpCreatedAt) {
      const expirationTime = 10 * 60 * 1000;
      const currentTime = new Date().getTime();
      const createdTime = new Date(
        user.deviceVerificationOtpCreatedAt,
      ).getTime();

      if (currentTime - createdTime > expirationTime) {
        throw new UnauthorizedException('Verification code expired');
      }
    }

    // Validate OTP
    if (otpCode !== user.deviceVerificationOtp) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Add device to verified devices
    await this.userService.addVerifiedDevice(
      user._id.toString(),
      user.pendingDeviceFingerprint,
    );

    // Clear verification data
    await this.userService.updateUser(user._id, {
      deviceVerificationOtp: null,
      deviceVerificationOtpCreatedAt: null,
      pendingDeviceFingerprint: null,
    });

    // Complete login
    return this.completeLogin(user, res);
  }

  async resendOtp(email: string): Promise<boolean> {
    this.logger.debug(`OTP resend attempt for email: ${email}`);

    try {
      // Find user by email
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        this.logger.warn(`User not found for OTP resend: ${email}`);
        throw new NotFoundException('User not found');
      }

      // Check if email is already verified
      if (user.isEmailVerified) {
        this.logger.debug(`Email already verified for user: ${email}`);
        throw new BadRequestException('Email is already verified');
      }

      // Implement rate limiting to prevent abuse
      if (user.otpCreatedAt) {
        const cooldownPeriod = 60 * 1000;
        const currentTime = new Date().getTime();
        const lastRequestTime = new Date(user.otpCreatedAt).getTime();

        if (currentTime - lastRequestTime < cooldownPeriod) {
          this.logger.warn(`OTP resend request too soon for user: ${email}`);
          throw new BadRequestException(
            'Please wait at least 1 minute before requesting a new code',
          );
        }
      }

      // Generate OTP using the same deterministic method
      const otpCode = this.generateDeterministicOtp(
        user._id.toString(),
        user.email,
        user.createdAt.getTime(),
      );

      // Update the OTP creation time
      await this.userService.updateUser(user._id, {
        otpCreatedAt: new Date(),
      });

      // Send verification email with OTP
      await this.emailService.sendEmailVerificationEmail(user, otpCode);
      this.logger.debug(`Verification email with OTP resent to ${user.email}`);

      return true;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log and wrap other errors
      this.logger.error(`OTP resend failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to resend verification code',
      );
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean }> {
    this.logger.debug(`Password reset requested for email: ${email}`);

    try {
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist (security best practice)
        this.logger.debug(`User not found for password reset: ${email}`);
        return { success: true };
      }

      // Create a JWT token with short expiration (2 hours)
      const resetToken = this.jwtService.sign(
        {
          sub: user._id,
          email: user.email,
          type: 'password-reset',
        },
        {
          secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: '2h',
        },
      );

      try {
        await this.emailService.sendPasswordResetEmail(user, resetToken);
        this.logger.debug(`Password reset email sent to ${email}`);
      } catch (emailError) {
        this.logger.error(
          `Failed to send password reset email: ${emailError.message}`,
          emailError.stack,
        );
        throw new InternalServerErrorException(
          'Failed to send password reset email',
        );
      }

      return { success: true };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(
        `Password reset request failed: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to process password reset request',
      );
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    this.logger.debug('Password reset attempt');

    try {
      // Verify the JWT token
      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
        });
      } catch (error) {
        this.logger.warn(
          `Invalid or expired password reset token: ${error.message}`,
        );
        throw new UnauthorizedException(
          'Password reset token is invalid or has expired',
        );
      }

      // Check if this is a password reset token
      if (payload.type !== 'password-reset') {
        this.logger.warn('Invalid token type for password reset');
        throw new UnauthorizedException('Invalid token type');
      }

      // Find the user
      const user = await this.userService.getUser({ _id: payload.sub });
      if (!user) {
        this.logger.warn(`User not found for userId: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and invalidate all existing sessions
      await this.userService.updateUser(user._id, {
        password: hashedPassword,
        refreshToken: null,
      });

      this.logger.debug(`Password successfully reset for userId: ${user._id}`);

      // Send confirmation email
      try {
        await this.emailService.sendPasswordChangeConfirmationEmail(user);
        this.logger.debug(
          `Password change confirmation email sent to ${user.email}`,
        );
      } catch (emailError) {
        this.logger.error(
          `Failed to send confirmation email: ${emailError.message}`,
          emailError.stack,
        );
      }

      return { success: true };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Password reset failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  private generateDeterministicOtp(
    userId: string,
    email: string,
    timestamp: number,
  ): string {
    const data = `${userId}:${email}:${timestamp}:OTP_SECRET`;

    const hash = crypto.createHash('sha256').update(data).digest('hex');
    const numericValue = parseInt(hash.substring(0, 8), 16);
    const sixDigitCode = String((numericValue % 900000) + 100000);

    return sixDigitCode;
  }

  async getProfile(userId: string) {
    this.logger.debug(`Getting profile for userId: ${userId}`);

    const user = await this.userService.getUser({ _id: userId });
    if (!user) {
      this.logger.warn(`User not found for userId: ${userId}`);
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userProfile } = user;
    this.logger.debug(`Profile retrieved for userId: ${userId}`);

    return userProfile;
  }

  private async generateTokens(user: any) {
    this.logger.debug(`Generating tokens for userId: ${user._id}`);

    const tokenPayload: TokenPayload = { email: user.email, userId: user._id };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS')}ms`,
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS')}ms`,
    });

    this.logger.debug(`Tokens generated successfully for userId: ${user._id}`);
    return { accessToken, refreshToken };
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    this.logger.debug('Setting token cookies');

    const accessTokenExpiration = new Date();
    accessTokenExpiration.setMilliseconds(
      accessTokenExpiration.getTime() +
        parseInt(
          this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_MS',
          ),
        ),
    );

    // Set access token cookie
    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      expires: accessTokenExpiration,
    });

    // Set refresh token cookie
    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      maxAge: parseInt(
        this.configService.getOrThrow<string>(
          'JWT_REFRESH_TOKEN_EXPIRATION_MS',
        ),
      ),
    });

    this.logger.debug('Token cookies set successfully');
  }
}
