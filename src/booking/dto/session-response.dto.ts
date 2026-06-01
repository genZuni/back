import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ESessionStatus, Session } from '../../entity/session.entity';

export class SessionResponseDto {
  @ApiProperty({ example: 'b3f1c2a4-5d6e-7f80-9a1b-2c3d4e5f6071' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-...' })
  teacherId: string;

  @ApiProperty({ example: 'e5f6a7b8-...' })
  studentId: string;

  @ApiProperty({ example: '2026-06-08T09:00:00.000Z' })
  startDateTime: Date;

  @ApiProperty({ example: '2026-06-08T10:00:00.000Z' })
  endDateTime: Date;

  @ApiProperty({ example: 60 })
  durationMinutes: number;

  @ApiProperty({ example: 150000 })
  price: number;

  @ApiProperty({ example: false })
  isTrial: boolean;

  @ApiProperty({ example: true })
  isPaid: boolean;

  @ApiProperty({ enum: ESessionStatus, example: ESessionStatus.SCHEDULED })
  sessionStatus: ESessionStatus;

  @ApiProperty({ example: false })
  paymentReleased: boolean;

  @ApiPropertyOptional({ example: 42, nullable: true })
  heldTransactionId: number | null;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  createdAt: Date;

  static fromEntity(s: Session): SessionResponseDto {
    return {
      id: s.id,
      teacherId: s.teacherId,
      studentId: s.studentId,
      startDateTime: s.startDateTime,
      endDateTime: s.endDateTime,
      durationMinutes: s.durationMinutes,
      price: Number(s.price),
      isTrial: s.isTrial,
      isPaid: s.isPaid,
      sessionStatus: s.sessionStatus,
      paymentReleased: s.paymentReleased,
      heldTransactionId: s.heldTransactionId,
      createdAt: s.createdAt,
    };
  }
}
