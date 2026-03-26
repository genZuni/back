import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Teacher } from './teacher.entity';
import { ELanguage } from 'src/common/enums/role.enum';

@Entity('teacherLocate')
export class TeacherLocate extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('text')
  discription: string;
  @Column()
  title: string;

  @Column('enum',{enum:ELanguage})
  locate: ELanguage;

  @ManyToOne(() => Teacher, (e) => e.locates)
  teacher: Teacher;
}
