import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceDto {
  @ApiProperty({ description: 'Current available balance.', example: 250000 })
  balance: number;

  @ApiProperty({
    description: 'Sum of all approved recharge transactions.',
    example: 500000,
  })
  totalRecharged: number;

  @ApiProperty({
    description: 'Sum of all approved payment transactions.',
    example: 250000,
  })
  totalSpent: number;
}
