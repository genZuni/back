// modules/category/entities/category.entity.ts
import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoryLocate } from './categoryLocate.enity';
import { Teacher } from './teacher.entity';

@Entity('category')
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  icon: string;

  @OneToMany(() => CategoryLocate, (locate) => locate.category, {
    cascade: true,
  })
  locates: CategoryLocate[];

  @OneToMany(() => Teacher, (locate) => locate.category, {
    onDelete: 'NO ACTION',
  })
  teachers: Teacher[];
}
