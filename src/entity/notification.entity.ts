import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ENotificationType {
  SESSION_REMINDER = 'session_reminder',
  PAYMENT_RELEASED = 'payment_released',
  BOOKING_APPROVED = 'booking_approved',
  RECHARGE_APPROVED = 'recharge_approved',
  SYSTEM = 'system',
}

@Entity('notification')
@Index(['userId', 'isRead'])
export class Notification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ENotificationType,
    default: ENotificationType.SYSTEM,
  })
  type: ENotificationType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ default: false })
  isRead: boolean;

  /** Optional in-app path to open when the notification is clicked. */
  @Column({ nullable: true })
  link?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
