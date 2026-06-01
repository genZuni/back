import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Id of the pending transaction the user is confirming.',
    example: 42,
  })
  @IsInt()
  @IsPositive()
  transactionId: number;
}
