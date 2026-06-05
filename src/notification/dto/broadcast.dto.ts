import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class BroadcastDto {
  @ApiProperty({ example: 'به‌روزرسانی پلتفرم' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({ enum: ['all', 'student', 'teacher', 'admin'], example: 'all' })
  @IsIn(['all', 'student', 'teacher', 'admin'])
  audience: 'all' | 'student' | 'teacher' | 'admin';
}
