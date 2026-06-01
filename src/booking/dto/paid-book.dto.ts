import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export enum EBookingFrequency {
  WEEKLY = 'weekly',
  DAILY = 'daily',
}

export class PaidBookDto {
  @ApiProperty({
    description: 'Teacher id (equals the teacher user id).',
    example: 'a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID()
  teacherId: string;

  @ApiProperty({
    description: 'Start of the first session, ISO 8601.',
    example: '2026-06-08T09:00:00.000Z',
  })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({
    description:
      'How many sessions to book. Each repeats at the given frequency from ' +
      'startDateTime (e.g. 5 weekly sessions). One Session record per slot.',
    example: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  numberOfSessions: number;

  @ApiPropertyOptional({
    description: 'Recurrence between sessions. Defaults to weekly.',
    enum: EBookingFrequency,
    default: EBookingFrequency.WEEKLY,
  })
  @IsOptional()
  @IsEnum(EBookingFrequency)
  frequency?: EBookingFrequency;
}
