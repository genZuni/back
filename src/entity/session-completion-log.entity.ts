import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Session } from './session.entity';

/**
 * Audit trail for session completion + payment release. One row is written each
 * time a teacher marks a session complete (and, for paid sessions, when the
 * held payment is released to the teacher's wallet).
 */
@Entity('session_completion_log')
export class SessionCompletionLog extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  confirmedByTeacherId: string;

  @Column({ type: 'datetime' })
  confirmedByTeacherAt: Date;

  @Column({ default: false })
  studentConfirmed: boolean;

  // The teacher-credit Transaction created on release (null for free trials).
  @Column({ type: 'int', nullable: true })
  releasedTransactionId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: Session;
}
