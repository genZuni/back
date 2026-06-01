import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Teacher } from './teacher.entity';

/**
 * Lifecycle of a booked session.
 * - SCHEDULED: booked, in the future (paid sessions hold the student's money).
 * - COMPLETED: the teacher confirmed the session happened (paid -> money released).
 * - CANCELLED: booking was cancelled (paid -> held money refunded).
 * - HELD: reserved for explicit escrow states if ever needed.
 */
export enum ESessionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  HELD = 'held',
}

/**
 * A single 1-on-1 lesson between a teacher and a student. Trial sessions are
 * free (price 0, isTrial true); paid sessions debit the student's wallet into
 * escrow at booking time and release it to the teacher on completion.
 *
 * `id` is a uuid string so it fits the existing `Transaction.classId` column.
 */
@Entity('session')
@Index(['teacherId', 'startDateTime'])
@Index(['studentId'])
export class Session extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Teacher.id === User.id (shared primary key on the teacher entity).
  @Column()
  teacherId: string;

  @Column()
  studentId: string;

  @Column({ type: 'datetime' })
  startDateTime: Date;

  @Column({ type: 'datetime' })
  endDateTime: Date;

  // Snapshot of Teacher.minutePerSession at booking time.
  @Column()
  durationMinutes: number;

  // Snapshot of Teacher.price at booking time (0 for trials).
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: false })
  isTrial: boolean;

  @Column({ default: false })
  isPaid: boolean;

  @Column({
    type: 'enum',
    enum: ESessionStatus,
    default: ESessionStatus.SCHEDULED,
  })
  sessionStatus: ESessionStatus;

  // Whether the held payment has been released to the teacher.
  @Column({ default: false })
  paymentReleased: boolean;

  // The held Transaction backing this paid session (null for trials).
  @Column({ type: 'int', nullable: true })
  heldTransactionId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;
}
