import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Max } from 'class-validator';

export class RechargeRequestDto {
  @ApiProperty({
    description: 'Amount to recharge the wallet with (positive decimal).',
    example: 150000,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  amount: number;
}
