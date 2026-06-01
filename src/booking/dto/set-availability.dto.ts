import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class AvailabilitySlotDto {
  @ApiProperty({
    description: 'Day of week. 0 = Sunday ... 6 = Saturday.',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Window start, 24h HH:mm.', example: '09:00' })
  @Matches(HHMM, { message: 'startTime must be in HH:mm format.' })
  startTime: string;

  @ApiProperty({ description: 'Window end, 24h HH:mm.', example: '12:00' })
  @Matches(HHMM, { message: 'endTime must be in HH:mm format.' })
  endTime: string;
}

export class SetAvailabilityDto {
  @ApiProperty({
    description:
      'The full weekly availability. Replaces any previously saved windows ' +
      'for the calling teacher.',
    type: [AvailabilitySlotDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}
