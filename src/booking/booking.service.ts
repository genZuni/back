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
import { Teacher } from '../entity/teacher.entity';
import { WalletService } from '../wallet/wallet.service';
import { AvailabilityService } from './availability.service';
import { TrialBookDto } from './dto/trial-book.dto';
import { PaidBookDto } from './dto/paid-book.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { NotificationService } from '../notification/notification.service';
import { ENotificationType } from '../entity/notification.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    private readonly walletService: WalletService,
    private readonly availabilityService: AvailabilityService,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  /** Books the student's single free trial session with a teacher. */
  async bookTrial(
    studentId: string,
    dto: TrialBookDto,
  ): Promise<SessionResponseDto> {
    const teacher = await this.loadTeacher(dto.teacherId);
    if (studentId === teacher.id) {
      throw new BadRequestException('You cannot book a session with yourself.');
    }

    const existingTrial = await this.sessionRepo.count({
      where: { teacherId: teacher.id, studentId, isTrial: true },
    });
    if (existingTrial > 0) {
      throw new ConflictException(
        'You have already booked a trial with this teacher.',
      );
    }

    const duration = this.requireDuration(teacher);
    const start = this.parseFutureDate(dto.startDateTime);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    await this.availabilityService.assertWithinAvailability(teacher.id, start, end);
    await this.availabilityService.assertNoOverlap(teacher.id, start, end);

    const session = this.sessionRepo.create({
      teacherId: teacher.id,
      studentId,
      startDateTime: start,
      endDateTime: end,
      durationMinutes: duration,
      price: 0,
      isTrial: true,
      isPaid: false,
      sessionStatus: ESessionStatus.SCHEDULED,
    });
    const saved = await this.sessionRepo.save(session);
    return SessionResponseDto.fromEntity(saved);
  }

  /**
   * Books one or more paid sessions (weekly/daily recurrence). All sessions are
   * created and their payments held atomically: if any slot conflicts or the
   * wallet has insufficient funds, nothing is persisted.
   */
  async bookPaid(
    studentId: string,
    dto: PaidBookDto,
  ): Promise<SessionResponseDto[]> {
    const teacher = await this.loadTeacher(dto.teacherId);
    if (studentId === teacher.id) {
      throw new BadRequestException('You cannot book a session with yourself.');
    }

    const completedTrial = await this.sessionRepo.count({
      where: {
        teacherId: teacher.id,
        studentId,
        isTrial: true,
        sessionStatus: ESessionStatus.COMPLETED,
      },
    });
    if (completedTrial === 0) {
      throw new ForbiddenException(
        'Complete your free trial with this teacher before booking paid sessions.',
      );
    }

    const duration = this.requireDuration(teacher);
    const price = Number(teacher.price);
    if (!price || price <= 0) {
      throw new BadRequestException('Teacher has not configured a price yet.');
    }

    const slots = dto.slots.map((s) => {
      const start = this.parseFutureDate(s.startDateTime);
      const end = new Date(start.getTime() + duration * 60 * 1000);
      return { start, end };
    });

    // Pre-validate every slot before touching the wallet (clear errors).
    for (const slot of slots) {
      await this.availabilityService.assertWithinAvailability(
        teacher.id,
        slot.start,
        slot.end,
      );
      await this.availabilityService.assertNoOverlap(
        teacher.id,
        slot.start,
        slot.end,
      );
    }

    const saved = await this.dataSource.transaction(async (m) => {
      const created: Session[] = [];
      for (const slot of slots) {
        // Re-check overlap inside the transaction (sees rows added in this loop).
        await this.availabilityService.assertNoOverlap(
          teacher.id,
          slot.start,
          slot.end,
          m,
        );

        let session = m.create(Session, {
          teacherId: teacher.id,
          studentId,
          startDateTime: slot.start,
          endDateTime: slot.end,
          durationMinutes: duration,
          price,
          isTrial: false,
          isPaid: true,
          sessionStatus: ESessionStatus.SCHEDULED,
          paymentReleased: false,
        });
        session = await m.save(Session, session);

        const held = await this.walletService.holdBalance(
          studentId,
          price,
          session.id,
          m,
        );
        session.heldTransactionId = held.id;
        session = await m.save(Session, session);

        created.push(session);
      }
      return created;
    });

    await this.safeNotify(
      studentId,
      ENotificationType.BOOKING_APPROVED,
      `${saved.length} جلسه با موفقیت رزرو شد`,
    );

    return saved.map(SessionResponseDto.fromEntity);
  }

  /** The student's own sessions, newest first, optionally filtered by status. */
  async getStudentSessions(
    studentId: string,
    status?: ESessionStatus,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepo.find({
      where: status ? { studentId, sessionStatus: status } : { studentId },
      order: { startDateTime: 'DESC' },
    });
    return sessions.map(SessionResponseDto.fromEntity);
  }

  /**
   * Cancels a future, still-scheduled session owned by the student. Any held
   * payment is refunded to the wallet (escrow -> back to student) atomically.
   * Policy: only `SCHEDULED` sessions that have not started yet can be cancelled.
   */
  async cancelSession(
    studentId: string,
    sessionId: string,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found.');
    }
    if (session.studentId !== studentId) {
      throw new ForbiddenException('This session does not belong to you.');
    }
    if (session.sessionStatus !== ESessionStatus.SCHEDULED) {
      throw new BadRequestException(
        'Only scheduled sessions can be cancelled.',
      );
    }
    if (new Date(session.startDateTime).getTime() <= Date.now()) {
      throw new BadRequestException('This session can no longer be cancelled.');
    }

    const saved = await this.dataSource.transaction(async (m) => {
      if (session.heldTransactionId) {
        await this.walletService.refundHold(session.heldTransactionId, m);
      }
      session.sessionStatus = ESessionStatus.CANCELLED;
      return m.save(Session, session);
    });

    await this.safeNotify(
      studentId,
      ENotificationType.SYSTEM,
      'جلسه شما لغو شد',
      session.isTrial
        ? undefined
        : 'مبلغ نگه‌داشته‌شده به کیف پول شما بازگردانده شد.',
    );

    return SessionResponseDto.fromEntity(saved);
  }

  /**
   * Student confirms a past session took place: marks it COMPLETED and releases
   * the held payment to the teacher. Only the owner can confirm, and only a
   * SCHEDULED session whose end time has already passed.
   */
  async confirmSession(
    studentId: string,
    sessionId: string,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found.');
    }
    if (session.studentId !== studentId) {
      throw new ForbiddenException('This session does not belong to you.');
    }
    if (session.sessionStatus !== ESessionStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled sessions can be confirmed.');
    }
    if (new Date(session.endDateTime).getTime() > Date.now()) {
      throw new BadRequestException(
        'You can confirm a session only after it has ended.',
      );
    }

    const saved = await this.dataSource.transaction(async (m) => {
      if (session.heldTransactionId) {
        await this.walletService.releaseHold(
          session.heldTransactionId,
          session.teacherId,
          m,
        );
      }
      session.sessionStatus = ESessionStatus.COMPLETED;
      session.paymentReleased = true;
      return m.save(Session, session);
    });

    await this.safeNotify(
      session.teacherId,
      ENotificationType.PAYMENT_RELEASED,
      'پرداخت جلسه آزاد شد',
      'دانش‌آموز برگزاری جلسه را تأیید کرد.',
    );
    await this.safeNotify(
      studentId,
      ENotificationType.SYSTEM,
      'جلسه تأیید شد',
      'از تأیید شما متشکریم.',
    );

    return SessionResponseDto.fromEntity(saved);
  }

  // ---- helpers -------------------------------------------------------------

  /** Best-effort notification: never blocks the booking flow if it fails. */
  private async safeNotify(
    userId: string,
    type: ENotificationType,
    title: string,
    body?: string,
  ): Promise<void> {
    try {
      await this.notificationService.create(userId, { type, title, body });
    } catch {
      /* best-effort */
    }
  }

  private async loadTeacher(teacherId: string): Promise<Teacher> {
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found.');
    }
    return teacher;
  }

  private requireDuration(teacher: Teacher): number {
    const duration = Number(teacher.minutePerSession);
    if (!duration || duration <= 0) {
      throw new BadRequestException(
        'Teacher has not configured a session duration yet.',
      );
    }
    return duration;
  }

  private parseFutureDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date.');
    }
    if (date.getTime() <= Date.now()) {
      throw new BadRequestException('Cannot book a session in the past.');
    }
    return date;
  }
}
