import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsDate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { Type } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Refresh token for authentication',
  })
  refreshToken?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    description: "Whether the user's email has been verified",
    example: false,
  })
  isEmailVerified?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    required: false,
    description: 'Timestamp when the OTP verification code was created',
    example: '2023-07-21T10:30:00Z',
  })
  otpCreatedAt?: Date;

  @IsOptional()
  deviceVerificationOtp?: string | null;

  @IsOptional()
  deviceVerificationOtpCreatedAt?: Date | null;

  @IsOptional()
  pendingDeviceFingerprint?: string | null;
}
