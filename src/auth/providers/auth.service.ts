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
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { User } from '../../user/schemas/user.schema';
import * as crypto from 'crypto';

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
    const user = await this.userService.findUserByEmail(email);
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

  async login(loginDto: LoginDto, res: Response) {
    this.logger.debug(`Login attempt for email: ${loginDto.email}`);

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.warn(`Login failed for email: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

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

      // Check if email is already verified
      if (user.isEmailVerified) {
        this.logger.debug(`Email already verified for user: ${email}`);
        return true;
      }

      // Check if OTP has expired (15 minutes)
      if (user.otpCreatedAt) {
        const otpExpirationTime = 15 * 60 * 1000;
        const currentTime = new Date().getTime();
        const otpCreatedTime = new Date(user.otpCreatedAt).getTime();

        if (currentTime - otpCreatedTime > otpExpirationTime) {
          this.logger.warn(`OTP expired for user: ${email}`);
          throw new UnauthorizedException(
            'Verification code has expired. Please request a new one.',
          );
        }
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
        error instanceof NotFoundException
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
