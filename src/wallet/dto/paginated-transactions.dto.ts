import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from './transaction-response.dto';

export class PaginatedTransactionsDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty({ example: 57 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
