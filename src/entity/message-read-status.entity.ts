// entities/message-read-status.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
} from 'typeorm';

import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('message_read_status')
export class MessageReadStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, (message) => message.readStatuses, {
    onDelete: 'CASCADE',
  })
  message: Message;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  seenAt: Date;
}
