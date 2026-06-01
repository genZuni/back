import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class AvailableSlotsQueryDto {
  @ApiPropertyOptional({
    description: 'Range start (inclusive), ISO date. Defaults to now.',
    example: '2026-06-02',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Range end (inclusive), ISO date. Defaults to now + 14 days.',
    example: '2026-06-16',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AvailableSlotDto {
  @ApiPropertyOptional({ example: '2026-06-08T09:00:00.000Z' })
  startDateTime: Date;

  @ApiPropertyOptional({ example: '2026-06-08T10:00:00.000Z' })
  endDateTime: Date;

  @ApiPropertyOptional({ example: 1, description: '0 = Sunday ... 6 = Saturday' })
  dayOfWeek: number;
}
