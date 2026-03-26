import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ 
    required: false,
    description: 'Update user balance'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}