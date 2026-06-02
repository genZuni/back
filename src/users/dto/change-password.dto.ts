import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'The user current password.' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password (min 6 chars).', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
