import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
  ForbiddenException,
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
import { GoogleAuthDto } from '../dtos/google-auth.dto';
import { RoleService } from '../../roles/providers/role.service';
import { Role } from '../../roles/schemas/role.schema';
import { BlacklistedRefreshToken } from '../schemas/blacklisted-refresh-token.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

interface LoginSuccessResult {
  accessToken: string;
  refreshToken: string;
  userId: any;
  email: any;
  requiresDeviceVerification?: undefined;
}

interface DeviceVerificationResult {
  requiresDeviceVerification: boolean;
  email: any;
  message: string;
}

type LoginResult = LoginSuccessResult | DeviceVerificationResult;
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(BlacklistedRefreshToken.name)
    private readonly blacklistedRefreshTokenModel: Model<BlacklistedRefreshToken>,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => RoleService))
    private readonly rolesService: RoleService,
  ) {
    this.logger.log('AuthService initialized');
  }

  async validateAdminUser(username: string, password: string): Promise<any> {
    this.logger.debug(`Attempting to validate admin user: ${username}`);

    // Find user by username with password
    const user =
      await this.userService.findUserByUsernameWithPassword(username);

    if (!user?.password) {
      this.logger.warn(`Admin user not found or password not set: ${username}`);
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    this.logger.debug(`Password validation result: ${isPasswordValid}`);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for admin: ${username}`);
      return null;
    }

    // Verify admin role
    const userWithRole = await this.rolesService.getUserWithRole(
      user._id.toString(),
    );
    const roleObj = userWithRole?.role ? (userWithRole.role as Role) : null;
    const roleName = roleObj?.name;

    if (roleName !== 'Super Admin' && roleName !== 'Administrator') {
      this.logger.warn(
        `User ${username} does not have admin privileges (role: ${roleName})`,
      );
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user.toObject ? user.toObject() : user;
    this.logger.debug(`Admin ${username} validated with role: ${roleName}`);

    return result;
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

  async login(
    loginDto: LoginDto,
    res: Response,
    req: Request,
  ): Promise<LoginResult> {
    const { email, password } = loginDto;
    this.logger.debug(`Login attempt for email: ${email}`);

    // First try to validate as a regular user
    let user = await this.validateUser(email, password);

    // If not a regular user, check if this might be an admin user
    if (!user) {
      this.logger.debug(
        `Regular user validation failed, trying admin validation for: ${email}`,
      );

      // Get the user with role to check if admin
      const potentialAdminUser = await this.userService.findUserByEmail(email);
      if (potentialAdminUser) {
        const userWithRole = await this.rolesService.getUserWithRole(
          potentialAdminUser._id.toString(),
        );
        const roleObj = userWithRole?.role ? (userWithRole.role as Role) : null;
        const roleName = roleObj?.name;

        if (roleName === 'Super Admin' || roleName === 'Administrator') {
          this.logger.debug(
            `User has admin role (${roleName}), validating as admin`,
          );
          user = await this.validateUser(email, password);
        }
      }
    }

    // Check if authentication was successful with either method
    if (!user) {
      this.logger.warn(`Login failed for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Continue with device verification and login completion
    const deviceFingerprint = this.generateDeviceFingerprint(req);
    this.logger.debug(
      `Device fingerprint generated for login: ${deviceFingerprint.substring(0, 8)}...`,
    );

    const isKnownDevice = await this.checkKnownDevice(
      user._id,
      deviceFingerprint,
    );

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

    const otpCode = this.generateDeterministicOtp(
      user._id.toString(),
      user.email,
      Date.now(),
    );

    await this.userService.updateUser(user._id, {
      deviceVerificationOtp: otpCode,
      deviceVerificationOtpCreatedAt: new Date(),
      pendingDeviceFingerprint: deviceFingerprint,
    });

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

    if (
      registerDto.role === 'Administrator' ||
      registerDto.role === 'Super Admin'
    ) {
      throw new ForbiddenException(
        'Administrator account creation is not permitted',
      );
    }

    try {
      const { role: roleName, ...userData } = registerDto;

      // Create user without role field first
      const user = await this.userService.createUser(userData);
      this.logger.debug(`User created with ID: ${user._id}`);

      // Now assign role by name
      try {
        // Find the role by name
        const role = await this.rolesService.findByName(roleName);
        if (!role) {
          this.logger.warn(`Role ${roleName} not found during registration`);
        } else {
          const roleId = (role as any)._id.toString();
          await this.rolesService.assignRoleToUser(user._id.toString(), roleId);
          this.logger.debug(`Role ${roleName} assigned to user ${user.email}`);
        }
      } catch (roleError) {
        this.logger.error(
          `Failed to assign role to user: ${roleError.message}`,
          roleError.stack,
        );
      }

      // Generate OTP using crypto for proper deterministic hashing
      const otpCode = this.generateDeterministicOtp(
        user._id.toString(),
        user.email,
        user.createdAt.getTime(),
      );

      // Mark user as unverified and set OTP timestamp
      await this.userService.updateUser(user._id, {
        isEmailVerified: false,
        otpCreatedAt: new Date(),
      });

      // Send verification email with OTP
      try {
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
    const user = await this.userService.getUser({ _id: userId });
    if (!user?.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(user);

    await this.blacklistRefreshToken(refreshToken, userId);
    await this.storeRefreshToken(user._id.toString(), newRefreshToken);
    this.setTokenCookies(res, accessToken, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  private async blacklistRefreshToken(
    token: string,
    userId: string,
  ): Promise<void> {
    const refreshExpiration = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRATION_MS',
    );
    const defaultExpiration = 7 * 24 * 60 * 60 * 1000;
    const expirationMs =
      typeof refreshExpiration === 'number' && refreshExpiration > 0
        ? refreshExpiration
        : defaultExpiration;

    const expiresAt = new Date(Date.now() + expirationMs);

    try {
      await this.blacklistedRefreshTokenModel.create({
        token,
        userId,
        expiresAt,
      });
    } catch (error) {
      this.logger.error(`Error blacklisting token: ${error.message}`);
    }
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateUser(
      { _id: userId },
      {
        refreshToken: hashedRefreshToken,
      },
    );
  }

  async isRefreshTokenBlacklisted(token: string): Promise<boolean> {
    const count = await this.blacklistedRefreshTokenModel
      .countDocuments({ token })
      .exec();
    return count > 0;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredRefreshTokens() {
    await this.blacklistedRefreshTokenModel
      .deleteMany({
        expiresAt: { $lte: new Date() },
      })
      .exec();
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

    if (!refreshToken || !userId) {
      this.logger.error('Missing token or user ID');
      throw new BadRequestException('Invalid verification request');
    }

    const user = await this.userService.getUser({ _id: userId });

    if (!user?.refreshToken) {
      this.logger.error(`No refresh token stored for user: ${userId}`);
      throw new NotFoundException('Session expired');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isValid) {
      this.logger.error(`Token mismatch for user: ${userId}`);
      // Fix this line to use a query object
      await this.userService.updateUser(
        { _id: userId },
        { refreshToken: null },
      );
      throw new UnauthorizedException('Security violation detected');
    }

    return user;
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

    // Check OTP expiration (1 minute)
    if (user.deviceVerificationOtpCreatedAt) {
      const expirationTime = 1 * 60 * 1000;
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

  async googleLogin(
    user: GoogleAuthDto,
    res: Response,
    req: Request,
  ): Promise<any> {
    this.logger.debug(`Google login attempt for email: ${user.email}`);

    try {
      let dbUser = await this.userService.findUserByEmail(user.email);

      if (!dbUser) {
        this.logger.debug(
          `Creating new user from Google account: ${user.email}`,
        );

        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const username =
          user.email.split('@')[0] + crypto.randomBytes(2).toString('hex');

        // Create new user
        dbUser = await this.userService.createUser({
          email: user.email,
          username,
          password: hashedPassword,
          isEmailVerified: true,
          provider: 'google',
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.picture,
        } as any);

        this.logger.debug(`New user created from Google OAuth: ${dbUser._id}`);

        // Assign default role (Participant) for Google users
        try {
          const roleName = ['Organizer', 'Participant'].includes(user.role)
            ? user.role
            : 'Participant';

          const role = await this.rolesService.findByName(roleName);

          if (!role) {
            this.logger.warn(
              `Role ${roleName} not found for Google user ${dbUser.email}`,
            );
          } else {
            const roleId = (role as any)._id.toString();
            await this.rolesService.assignRoleToUser(
              dbUser._id.toString(),
              roleId,
            );
            this.logger.debug(
              `Role ${roleName} assigned to Google user ${dbUser.email}`,
            );
          }
        } catch (roleError) {
          this.logger.error(
            `Failed to assign role to Google user: ${roleError.message}`,
            roleError.stack,
          );
        }

        // Send registration welcome email
        try {
          await this.emailService.sendRegistrationEmail(dbUser);
          this.logger.debug(
            `Registration welcome email sent to ${dbUser.email}`,
          );
        } catch (emailError) {
          this.logger.error(
            `Failed to send registration welcome email: ${emailError.message}`,
            emailError.stack,
          );
        }
      } else {
        this.logger.debug(
          `Existing user found for Google login: ${dbUser._id}`,
        );
      }

      const deviceFingerprint = this.generateDeviceFingerprint(req);
      this.logger.debug(
        `Device fingerprint generated for Google login: ${deviceFingerprint.substring(0, 8)}...`,
      );

      const isKnownDevice = await this.checkKnownDevice(
        dbUser._id.toString(),
        deviceFingerprint,
      );

      if (!isKnownDevice) {
        await this.userService.addVerifiedDevice(
          dbUser._id.toString(),
          deviceFingerprint,
        );
      }

      // Complete login with JWT generation
      return this.completeLogin(dbUser, res);
    } catch (error) {
      this.logger.error(`Google login failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Google authentication failed');
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

    const userWithRole = await this.rolesService.getUserWithRole(user._id);

    // Add type assertion to properly handle the Role | ObjectId union type
    const roleObj = userWithRole?.role ? (userWithRole.role as Role) : null;
    const role = roleObj?.name || null;
    const permissions = roleObj?.permissions || [];

    const tokenPayload: TokenPayload = {
      email: user.email,
      userId: user._id,
      role,
      permissions,
    };

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
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    const isLocal = !isProduction;
    const sameSite = isLocal ? 'lax' : 'strict';
    const secureCookie = isProduction;

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: sameSite,
      maxAge: this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
    });

    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: sameSite,
      maxAge: this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION_MS'),
    });
  }
}
