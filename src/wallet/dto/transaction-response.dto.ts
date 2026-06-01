import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ETransaction,
  ETransactionStatus,
  TransactionEntity,
} from '../../entity/transaction.entity';

// Friendly API values mapped from the internal DB enums.
export type ApiTransactionType = 'recharge' | 'payment';
export type ApiTransactionStatus = 'pending' | 'approved' | 'rejected';

function mapType(type: ETransaction): ApiTransactionType {
  return type === ETransaction.INCOME ? 'recharge' : 'payment';
}

function mapStatus(status: ETransactionStatus): ApiTransactionStatus {
  switch (status) {
    case ETransactionStatus.ACCEPTED:
      return 'approved';
    case ETransactionStatus.FAIL:
      return 'rejected';
    default:
      return 'pending';
  }
}

export class TransactionResponseDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'b3f1c2a4-5d6e-7f80-9a1b-2c3d4e5f6071' })
  userId: string;

  @ApiProperty({ example: 150000 })
  amount: number;

  @ApiProperty({ enum: ['recharge', 'payment'], example: 'recharge' })
  type: ApiTransactionType;

  @ApiProperty({
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
  })
  status: ApiTransactionStatus;

  @ApiPropertyOptional({ example: '1234' })
  cardNumberLast4?: string;

  @ApiPropertyOptional({ example: 'class-12' })
  classId?: string;

  @ApiPropertyOptional({ example: 'Verified against bank statement.' })
  adminNote?: string;

  @ApiProperty({ example: false })
  userConfirmed: boolean;

  @ApiProperty({ example: '2026-05-31T12:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2026-05-31T13:00:00.000Z' })
  approvedAt?: Date;

  @ApiPropertyOptional({ example: 'a1b2c3d4-...' })
  approvedBy?: string;

  static fromEntity(tx: TransactionEntity): TransactionResponseDto {
    return {
      id: tx.id,
      userId: tx.userId,
      amount: Number(tx.amount),
      type: mapType(tx.type),
      status: mapStatus(tx.status),
      cardNumberLast4: tx.cardNumberLast4,
      classId: tx.classId,
      adminNote: tx.adminNote,
      userConfirmed: tx.userConfirmed,
      createdAt: tx.createdAt,
      approvedAt: tx.approvedAt,
      approvedBy: tx.approvedBy,
    };
  }
}
