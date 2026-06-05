import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ESessionStatus, Session } from '../entity/session.entity';
import { SessionCompletionLog } from '../entity/session-completion-log.entity';
import { WalletService } from '../wallet/wallet.service';
import { SessionResponseDto } from './dto/session-response.dto';
import { EDisputeAction, ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(SessionCompletionLog)
    private readonly logRepo: Repository<SessionCompletionLog>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  /** The teacher's own sessions (trial + paid), chronological. */
  async getTeacherSessions(
    teacherId: string,
    status?: ESessionStatus,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepo.find({
      where: status ? { teacherId, sessionStatus: status } : { teacherId },
      order: { startDateTime: 'ASC' },
    });
    return sessions.map(SessionResponseDto.fromEntity);
  }

  /** Admin: every session in the system, newest first. */
  async getAllSessions(): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepo.find({
      order: { startDateTime: 'DESC' },
    });
    return sessions.map(SessionResponseDto.fromEntity);
  }

  /**
   * Admin: cancels any scheduled session (no owner/time checks). Refunds any
   * held payment to the student.
   */
  async adminCancelSession(sessionId: string): Promise<SessionResponseDto> {
    const result = await this.dataSource.transaction(async (m) => {
      const session = await m.findOne(Session, {
        where: { id: sessionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) {
        throw new NotFoundException('Session not found.');
      }
      if (session.sessionStatus !== ESessionStatus.SCHEDULED) {
        throw new ConflictException('Only scheduled sessions can be cancelled.');
      }

      if (session.heldTransactionId != null && !session.paymentReleased) {
        await this.walletService.refundHold(session.heldTransactionId, m);
      }
      session.sessionStatus = ESessionStatus.CANCELLED;
      return m.save(Session, session);
    });

    return SessionResponseDto.fromEntity(result);
  }

  /**
   * Teacher marks a session complete. For paid sessions this releases the held
   * payment to the teacher's wallet. Idempotency is guarded by requiring the
   * session to be SCHEDULED.
   */
  async completeSession(
    teacherId: string,
    sessionId: string,
  ): Promise<SessionResponseDto> {
    const result = await this.dataSource.transaction(async (m) => {
      const session = await m.findOne(Session, {
        where: { id: sessionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) {
        throw new NotFoundException('Session not found.');
      }
      if (session.teacherId !== teacherId) {
        throw new ForbiddenException('This session does not belong to you.');
      }
      if (session.sessionStatus !== ESessionStatus.SCHEDULED) {
        throw new ConflictException(
          'Only scheduled sessions can be marked complete.',
        );
      }

      let releasedTransactionId: number | null = null;

      // Paid sessions: release the escrowed payment to the teacher.
      if (
        session.isPaid &&
        !session.paymentReleased &&
        session.heldTransactionId != null
      ) {
        const credit = await this.walletService.releaseHold(
          session.heldTransactionId,
          teacherId,
          m,
        );
        releasedTransactionId = credit.id;
        session.paymentReleased = true;
      }

      session.sessionStatus = ESessionStatus.COMPLETED;
      const saved = await m.save(Session, session);

      const log = m.create(SessionCompletionLog, {
        sessionId: saved.id,
        confirmedByTeacherId: teacherId,
        confirmedByTeacherAt: new Date(),
        studentConfirmed: false,
        releasedTransactionId,
      });
      await m.save(SessionCompletionLog, log);

      return saved;
    });

    return SessionResponseDto.fromEntity(result);
  }

  /**
   * Admin dispute resolution for a paid session that still holds money:
   * either force-release to the teacher or refund the student and cancel it.
   */
  async resolveDispute(
    sessionId: string,
    dto: ResolveDisputeDto,
  ): Promise<SessionResponseDto> {
    const result = await this.dataSource.transaction(async (m) => {
      const session = await m.findOne(Session, {
        where: { id: sessionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) {
        throw new NotFoundException('Session not found.');
      }
      if (
        !session.isPaid ||
        session.paymentReleased ||
        session.heldTransactionId == null
      ) {
        throw new BadRequestException(
          'This session has no held payment to resolve.',
        );
      }

      if (dto.action === EDisputeAction.RELEASE) {
        const credit = await this.walletService.releaseHold(
          session.heldTransactionId,
          session.teacherId,
          m,
        );
        session.paymentReleased = true;
        session.sessionStatus = ESessionStatus.COMPLETED;
        const saved = await m.save(Session, session);

        const log = m.create(SessionCompletionLog, {
          sessionId: saved.id,
          confirmedByTeacherId: session.teacherId,
          confirmedByTeacherAt: new Date(),
          studentConfirmed: false,
          releasedTransactionId: credit.id,
        });
        await m.save(SessionCompletionLog, log);

        return saved;
      }

      // REFUND: return money to the student and cancel the session.
      await this.walletService.refundHold(session.heldTransactionId, m);
      session.sessionStatus = ESessionStatus.CANCELLED;
      return m.save(Session, session);
    });

    return SessionResponseDto.fromEntity(result);
  }
}
