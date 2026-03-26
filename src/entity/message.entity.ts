// entities/message.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Ticket } from './ticket.entity';

import { MessageReadStatus } from './message-read-status.entity';
import { User } from './user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  fileUrl: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
  ticket: Ticket;

  @ManyToOne(() => User)
  sender: User;

  @OneToMany(() => MessageReadStatus, (readStatus) => readStatus.message, { cascade: true })
  readStatuses: MessageReadStatus[];

  @CreateDateColumn()
  createdAt: Date;
}