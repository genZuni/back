import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ETransaction {
  INCOME = 'incom',
  OUTCOME = 'outcome',
  PAYMENT = 'payment',
}
export enum ETransactionStatus {
  WAITING = 'waiting',
  ACCEPTED = 'accepted',
  FAIL = 'fail',
  // Escrow: money debited from the payer but not yet credited to the payee.
  // Released (-> ACCEPTED) when the related session is completed, or refunded
  // (-> FAIL, balance returned) when the booking is cancelled.
  HELD = 'held',
}
@Entity('Transaction')
export class TransactionEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { scale: 2, precision: 10 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  describe?: string;

  // Zarinpal gateway authority (legacy online-payment flow in OrderModule).
  @Column({ nullable: true })
  authority: string;

  @Column({ enum: ETransaction, type: 'enum' })
  type: ETransaction;

  @Column({ enum: ETransactionStatus, type: 'enum' })
  status: ETransactionStatus;

  @Column({ nullable: true })
  card_pan: string;

  @Column({ nullable: true })
  card_hash: string;

  // ---- Wallet module additions (manual bank-card recharge flow) ----

  // Owner of the transaction (User.id is a uuid).
  @Column({ nullable: true })
  userId: string;

  // Last 4 digits of the card used for the manual bank transfer.
  @Column({ length: 4, nullable: true })
  cardNumberLast4?: string;

  // Class this payment relates to (for 'payment' transactions).
  @Column({ nullable: true })
  classId?: string;

  // Note left by the admin when approving/rejecting.
  @Column({ type: 'text', nullable: true })
  adminNote?: string;

  // Set when the user claims they completed the bank transfer.
  @Column({ default: false })
  userConfirmed: boolean;

  // When the transaction was approved/rejected.
  @Column({ type: 'datetime', nullable: true })
  approvedAt?: Date;

  // Admin (User.id uuid) who approved/rejected.
  @Column({ nullable: true })
  approvedBy?: string;

  @ManyToOne(() => User, (e) => e.transactions, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
