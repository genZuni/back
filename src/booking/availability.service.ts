import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { TeacherAvailability } from '../entity/teacher-availability.entity';
import { Teacher } from '../entity/teacher.entity';
import { ESessionStatus, Session } from '../entity/session.entity';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { AvailableSlotDto } from './dto/available-slots-query.dto';

// Sessions in these states occupy the teacher's calendar (block new bookings).
export const ACTIVE_SESSION_STATUSES = [
  ESessionStatus.SCHEDULED,
  ESessionStatus.HELD,
  ESessionStatus.COMPLETED,
];

const MAX_SLOT_RANGE_DAYS = 60;
const DEFAULT_SLOT_RANGE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Teacher weekly availability + booking-slot generation.
 *
 * All wall-clock times (`HH:mm` windows, generated slots, and the day-of-week
 * of a booking) are interpreted in UTC so the result is deterministic across
 * server timezones. The frontend should send/display times in UTC accordingly.
 */
@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(TeacherAvailability)
    private readonly availabilityRepo: Repository<TeacherAvailability>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    private readonly dataSource: DataSource,
  ) {}

  /** Replaces the teacher's entire weekly schedule with the given windows. */
  async setAvailability(
    teacherId: string,
    dto: SetAvailabilityDto,
  ): Promise<AvailabilityResponseDto[]> {
    for (const slot of dto.slots) {
      if (toMinutes(slot.startTime) >= toMinutes(slot.endTime)) {
        throw new BadRequestException(
          `startTime (${slot.startTime}) must be before endTime (${slot.endTime}).`,
        );
      }
    }

    const saved = await this.dataSource.transaction(async (m) => {
      await m.delete(TeacherAvailability, { teacherId });
      const rows = dto.slots.map((slot) =>
        m.create(TeacherAvailability, {
          teacherId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      );
      return m.save(TeacherAvailability, rows);
    });

    return saved.map(AvailabilityResponseDto.fromEntity);
  }

  /** All availability windows for a teacher, ordered for display. */
  async getAvailability(teacherId: string): Promise<AvailabilityResponseDto[]> {
    const rows = await this.availabilityRepo.find({
      where: { teacherId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    return rows.map(AvailabilityResponseDto.fromEntity);
  }

  /** Removes a single availability window owned by the teacher. */
  async removeAvailability(teacherId: string, id: string): Promise<void> {
    const row = await this.availabilityRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Availability window not found.');
    }
    if (row.teacherId !== teacherId) {
      throw new ForbiddenException('This availability does not belong to you.');
    }
    await this.availabilityRepo.delete({ id });
  }

  /**
   * Generates bookable slots for a teacher between `from` and `to`, slicing each
   * weekly window into `minutePerSession` chunks and dropping past slots and any
   * that overlap an existing booking.
   */
  async getAvailableSlots(
    teacherId: string,
    from?: string,
    to?: string,
  ): Promise<AvailableSlotDto[]> {
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found.');
    }
    const duration = Number(teacher.minutePerSession);
    if (!duration || duration <= 0) {
      throw new BadRequestException(
        'Teacher has not configured a session duration yet.',
      );
    }

    const now = new Date();
    const rangeStart = from ? new Date(from) : now;
    const rangeEnd = to
      ? new Date(to)
      : new Date(now.getTime() + DEFAULT_SLOT_RANGE_DAYS * DAY_MS);

    if (rangeEnd <= rangeStart) {
      throw new BadRequestException('`to` must be after `from`.');
    }
    if (rangeEnd.getTime() - rangeStart.getTime() > MAX_SLOT_RANGE_DAYS * DAY_MS) {
      throw new BadRequestException(
        `Date range cannot exceed ${MAX_SLOT_RANGE_DAYS} days.`,
      );
    }

    const windows = await this.availabilityRepo.find({ where: { teacherId } });
    if (windows.length === 0) {
      return [];
    }

    const existing = await this.sessionRepo.find({
      where: {
        teacherId,
        sessionStatus: In(ACTIVE_SESSION_STATUSES),
      },
      select: ['startDateTime', 'endDateTime'],
    });
    const busy = existing.map((s) => ({
      start: new Date(s.startDateTime).getTime(),
      end: new Date(s.endDateTime).getTime(),
    }));

    const slots: AvailableSlotDto[] = [];

    // Iterate day by day (UTC midnight) across the range.
    let cursor = Date.UTC(
      rangeStart.getUTCFullYear(),
      rangeStart.getUTCMonth(),
      rangeStart.getUTCDate(),
    );
    const lastDay = Date.UTC(
      rangeEnd.getUTCFullYear(),
      rangeEnd.getUTCMonth(),
      rangeEnd.getUTCDate(),
    );

    for (; cursor <= lastDay; cursor += DAY_MS) {
      const dayMidnight = new Date(cursor);
      const dow = dayMidnight.getUTCDay();
      const dayWindows = windows.filter((w) => w.dayOfWeek === dow);

      for (const w of dayWindows) {
        const windowStart = toMinutes(w.startTime);
        const windowEnd = toMinutes(w.endTime);

        for (
          let m = windowStart;
          m + duration <= windowEnd;
          m += duration
        ) {
          const slotStart = new Date(cursor + m * 60 * 1000);
          const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

          if (slotStart.getTime() < now.getTime()) continue;
          if (slotStart.getTime() > rangeEnd.getTime()) continue;

          const overlaps = busy.some(
            (b) => slotStart.getTime() < b.end && slotEnd.getTime() > b.start,
          );
          if (overlaps) continue;

          slots.push({ startDateTime: slotStart, endDateTime: slotEnd, dayOfWeek: dow });
        }
      }
    }

    slots.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
    return slots;
  }

  // ---- shared validation helpers (used by BookingService) ------------------

  /** Throws unless [start, end) fits entirely inside one availability window. */
  async assertWithinAvailability(
    teacherId: string,
    start: Date,
    end: Date,
  ): Promise<void> {
    const dow = start.getUTCDay();
    const startMin = start.getUTCHours() * 60 + start.getUTCMinutes();
    const endMin = startMin + (end.getTime() - start.getTime()) / 60000;

    const windows = await this.availabilityRepo.find({
      where: { teacherId, dayOfWeek: dow },
    });

    const fits = windows.some(
      (w) => toMinutes(w.startTime) <= startMin && endMin <= toMinutes(w.endTime),
    );
    if (!fits) {
      throw new BadRequestException(
        'Selected time is outside the teacher availability.',
      );
    }
  }

  /** Throws if the teacher already has an active session overlapping [start, end). */
  async assertNoOverlap(
    teacherId: string,
    start: Date,
    end: Date,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Session) : this.sessionRepo;
    const count = await repo
      .createQueryBuilder('s')
      .where('s.teacherId = :teacherId', { teacherId })
      .andWhere('s.sessionStatus IN (:...statuses)', {
        statuses: ACTIVE_SESSION_STATUSES,
      })
      .andWhere('s.startDateTime < :end AND s.endDateTime > :start', {
        start,
        end,
      })
      .getCount();

    if (count > 0) {
      throw new ConflictException(
        `Time slot ${start.toISOString()} is already booked.`,
      );
    }
  }
}

/** 'HH:mm' -> minutes since midnight. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
