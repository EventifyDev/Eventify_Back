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
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from '../providers/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from '../guards/jwt-refresh-auth.guard';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {
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
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials.',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`Login attempt with email: ${loginDto.email}`);
    try {
      const result = await this.authService.login(loginDto, res);
      this.logger.log(`User logged in successfully: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw error;
    }
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
    await this.authService.resendOtp(email);
    return {
      success: true,
      message: 'Verification code sent successfully. Please check your email.',
    };
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
  async getProfile(@User('_id') userId: string) {
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens successfully refreshed.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token.',
  })
  async refreshTokens(
    @User('_id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`Token refresh attempt for userId: ${userId}`);
    try {
      const refreshToken = req.cookies?.Refresh;
      this.logger.debug(`Refresh token present: ${!!refreshToken}`);

      const result = await this.authService.refreshTokens(
        userId,
        refreshToken,
        res,
      );
      this.logger.log(`Tokens refreshed successfully for userId: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged out.',
  })
  async logout(
    @User('_id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`Logout attempt for userId: ${userId}`);
    try {
      const result = await this.authService.logout(userId, res);
      this.logger.log(`User logged out successfully: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);
      throw error;
    }
  }
}
