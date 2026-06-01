import { ApiProperty } from '@nestjs/swagger';
import { TeacherAvailability } from '../../entity/teacher-availability.entity';

export class AvailabilityResponseDto {
  @ApiProperty({ example: 'b3f1c2a4-5d6e-7f80-9a1b-2c3d4e5f6071' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-...' })
  teacherId: string;

  @ApiProperty({ example: 1, description: '0 = Sunday ... 6 = Saturday' })
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  startTime: string;

  @ApiProperty({ example: '12:00' })
  endTime: string;

  static fromEntity(a: TeacherAvailability): AvailabilityResponseDto {
    return {
      id: a.id,
      teacherId: a.teacherId,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    };
  }
}
