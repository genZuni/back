import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminApproveDto {
  @ApiPropertyOptional({
    description: 'Optional note from the admin about this decision.',
    example: 'Verified against bank statement #1029.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
