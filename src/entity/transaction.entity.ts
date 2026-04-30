import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ nullable: true })
  authority: string;

  @Column({ enum: ETransaction, type: 'enum' })
  type: ETransaction;

  @Column({ enum: ETransaction, type: 'enum' })
  status: ETransactionStatus;

  @Column({ nullable: true })
  card_pan: string;

  @Column({ nullable: true })
  card_hash: string;

  @ManyToOne(() => User, (e) => e.transactions, { onDelete: 'NO ACTION' })
  user: User;
}
