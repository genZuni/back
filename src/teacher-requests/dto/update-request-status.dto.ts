// src/teacher-requests/dto/update-request-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RequestStatus } from 'src/entity/teacher-request.entity';

export class UpdateRequestStatusDto {
  @ApiProperty({
    description: 'Request status',
    enum: RequestStatus,
    example: RequestStatus.REVIEWED,
    required: true
  })
  @IsEnum(RequestStatus, { message: 'وضعیت نامعتبر است' })
  status: RequestStatus;

  @ApiProperty({
    description: 'Review notes',
    example: 'سابقه کاری مناسب، قابل تایید',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'یادداشت بررسی باید متن باشد' })
  reviewNotes?: string;
}