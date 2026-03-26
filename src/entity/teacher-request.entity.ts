// src/teacher-requests/entities/teacher-request.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index 
} from 'typeorm';

export enum RequestStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum EnglishLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  NATIVE = 'native'
}

@Entity('teacher_requests')
export class TeacherRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Personal Information
  @Column()
  @Index()
  fullName: string;

  @Column()
  subject: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  residenceCountry: string;

  @Column()
  howLearnedAboutUs: string;

  @Column({
    type: 'enum',
    enum: EnglishLevel,
    default: EnglishLevel.INTERMEDIATE
  })
  englishLevel: EnglishLevel;

  @Column({ nullable: true })
  socialMedia: string;

  // Experience
  @Column({ type: 'text' })
  teachingExperience: string;

  @Column({ type: 'text', nullable: true })
  onlineTeachingExperience: string;

  @Column({ type: 'text', nullable: true })
  foreignTeachingExperience: string;

  // Education
  @Column({ nullable: true })
  degreeOfEducation: string;

  // Teaching Details
  @Column('int')
  duration: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('simple-array')
  ageGroup: string[]; // ['4-6', '6-12', '12-18', '18-65', '65-up']

  // Additional Info
  @Column({ type: 'text', nullable: true })
  honors: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ nullable: true })
  resumePath: string;

  // Status
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING
  })
  @Index()
  status: RequestStatus;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  // Metadata
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}