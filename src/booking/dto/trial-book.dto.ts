import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID } from 'class-validator';

export class TrialBookDto {
  @ApiProperty({
    description: 'Teacher id (equals the teacher user id).',
    example: 'a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  })
  // @IsUUID()
  @IsString()
  teacherId: string;

  @ApiProperty({
    description: 'Start of the trial session, ISO 8601.',
    example: '2026-06-08T09:00:00.000Z',
  })
  @IsDateString()
  startDateTime: string;
}
