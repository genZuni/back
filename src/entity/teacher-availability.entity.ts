import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Teacher } from './teacher.entity';

/**
 * One recurring weekly availability window for a teacher, e.g.
 * { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' } (Mondays 9am-12pm).
 * The booking slot generator slices these windows into `minutePerSession` slots.
 */
@Entity('teacher_availability')
@Unique(['teacherId', 'dayOfWeek', 'startTime', 'endTime'])
export class TeacherAvailability extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Teacher.id === User.id (shared primary key on the teacher entity).
  @Column()
  teacherId: string;

  // 0 = Sunday ... 6 = Saturday.
  @Column({ type: 'int' })
  dayOfWeek: number;

  // 'HH:mm' 24h, inclusive start.
  @Column({ length: 5 })
  startTime: string;

  // 'HH:mm' 24h, exclusive end.
  @Column({ length: 5 })
  endTime: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;
}
