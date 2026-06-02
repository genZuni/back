import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PaidBookSlotDto {
  @ApiProperty({
    description: 'Start of one session, ISO 8601 (UTC).',
    example: '2026-06-08T09:00:00.000Z',
  })
  @IsDateString()
  startDateTime: string;
}

export class PaidBookDto {
  @ApiProperty({
    description: 'Teacher id (equals the teacher user id).',
    example: 'a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsString()
  teacherId: string;

  @ApiProperty({
    description:
      'Sessions to book. The student picks each slot freely (any days). ' +
      'One Session record is created per slot; each session duration comes ' +
      "from the teacher's minutePerSession.",
    type: [PaidBookSlotDto],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PaidBookSlotDto)
  slots: PaidBookSlotDto[];
}
