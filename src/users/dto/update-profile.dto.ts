import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/** Fields a user may edit on their OWN profile (`PATCH /users/me`). */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Sara Ahmadi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'sara@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+989120000000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Iran' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;
}
