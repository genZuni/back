import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TeacherLocate } from './teacherLocate.entity';
import { Category } from './category.enity';

export enum TEnglishLevel {
  good = 'good',
}

@Entity('teacher')
export class Teacher extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ nullable: true })
  minutePerSession: number;
  @Column({ nullable: true })
  photo: string;
  @Column('decimal', { nullable: true })
  price: number;
  @Column({ nullable: true })
  ages: string;
  @Column({ nullable: true })
  englishLevel: TEnglishLevel;

  @OneToOne(() => User, (e) => e.teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: User;

  @OneToMany(() => TeacherLocate, (e) => e.teacher)
  locates: TeacherLocate[];

  @ManyToOne(() => Category, (e) => e.teachers, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  category?: Category;
}
