import {
  Controller,
  Post,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Res,
  Req,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../providers/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from '../guards/jwt-refresh-auth.guard';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import { User } from '../../common/decorators/user.decorator';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { VerifyDeviceDto } from '../dtos/verify-device.dto';
import { GoogleAuthGuard } from '../guards/google-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('AuthController initialized');
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or username already exists.',
  })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registration attempt with email: ${registerDto.email}`);
    try {
      const result = await this.authService.register(registerDto);
      this.logger.log(`User registered successfully: ${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`);
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.login(loginDto, res, req);
    if (result.requiresDeviceVerification) {
      return res.status(HttpStatus.OK).json({
        requiresDeviceVerification: true,
        email: loginDto.email,
        message: 'Device verification required',
      });
    }
    return res.json(result);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login flow' })
  @ApiResponse({
    status: 200,
    description: 'Redirected to Google authentication page',
  })
  @ApiQuery({
    name: 'role',
    enum: ['Organizer', 'Participant'],
    required: true,
  })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const { accessToken, refreshToken } = req.user;

    res.redirect(
      `${frontendUrl}/auth/social-login?` +
        `accessToken=${accessToken}&` +
        `refreshToken=${refreshToken}&` +
        `role=${req.user.role}`,
    );
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP code' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(
      verifyOtpDto.email,
      verifyOtpDto.otpCode,
    );
    return { success: result, message: 'Email verified successfully' };
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification OTP code' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Too many requests' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendOtp(@Body('email') email: string) {
    this.logger.log(`Resend OTP request for email: ${email}`);
    try {
      await this.authService.resendOtp(email);
      this.logger.log(`OTP resent successfully to: ${email}`);
      return {
        success: true,
        message:
          'Verification code sent successfully. Please check your email.',
      };
    } catch (error) {
      this.logger.error(`OTP resend failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('verify-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify login from new device with OTP code' })
  @ApiResponse({ status: 200, description: 'Device verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  @ApiResponse({ status: 400, description: 'No pending device verification' })
  async verifyDevice(
    @Body() verifyDeviceDto: VerifyDeviceDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(
      `Device verification attempt for email: ${verifyDeviceDto.email}`,
    );
    try {
      const result = await this.authService.verifyDevice(verifyDeviceDto, res);

      this.logger.log(
        `Device verified successfully for: ${verifyDeviceDto.email}`,
      );
      return {
        success: true,
        message: 'Device verified successfully',
        ...result,
      };
    } catch (error) {
      this.logger.error(`Device verification failed: ${error.message}`);
      throw error;
    }
  }
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent if email exists.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(
      `Password reset requested for email: ${forgotPasswordDto.email}`,
    );
    try {
      const result = await this.authService.forgotPassword(
        forgotPasswordDto.email,
      );
      this.logger.log(
        `Password reset email sent for: ${forgotPasswordDto.email}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Password reset request failed: ${error.message}`);
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password successfully reset.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid password format.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log('Password reset attempt');
    try {
      const result = await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
      this.logger.log('Password reset successful');
      return result;
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`);
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated.',
  })
  async getProfile(@User('userId') userId: string) {
    this.logger.log(`Profile retrieval for userId: ${userId}`);
    try {
      const result = await this.authService.getProfile(userId);
      this.logger.log(`Profile retrieved successfully for userId: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Profile retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshTokens(
    @User('userId') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ) {
    // Extract token from cookies, authorization header, or request body
    const refreshToken =
      req.cookies?.Refresh ||
      this.extractTokenFromHeader(req) ||
      body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(userId, refreshToken, res);

    // Set cookies for browser clients
    res.cookie('Authentication', accessToken, { httpOnly: true });
    res.cookie('Refresh', newRefreshToken, { httpOnly: true });

    // Return tokens in response body for non-browser clients
    return { accessToken, refreshToken: newRefreshToken };
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const userId = req.user?.['_id'];
      if (userId) {
        await this.authService.logout(userId, res);
      }
    } finally {
      res.clearCookie('Authentication');
      res.clearCookie('Refresh');
      return { success: true };
    }
  }
}
