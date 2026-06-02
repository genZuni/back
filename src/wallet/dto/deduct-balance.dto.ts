import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

/**
 * Admin/testing DTO for POST /admin/wallet/deduct.
 */
export class DeductBalanceDto {
  @ApiProperty({
    description: 'User whose wallet will be charged (uuid).',
    example: 'b3f1c2a4-5d6e-7f80-9a1b-2c3d4e5f6071',
  })
  // @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Amount to deduct (positive decimal).',
    example: 99000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Class the payment is for.',
    example: 'class-12',
  })
  @IsString()
  classId: string;
}
