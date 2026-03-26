// dto/send-message.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiProperty({ description: 'Optional file URL', required: false })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;
}