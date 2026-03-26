// modules/category/entities/category-locate.entity.ts
import { ELanguage } from 'src/common/enums/role.enum';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.enity';

@Entity('category-locate')
export class CategoryLocate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: ELanguage,
    default: ELanguage.EN,
  })
  locate: ELanguage;

  @ManyToOne(() => Category, (category) => category.locates, {
    onDelete: 'CASCADE',
  })
  category: Category;
}
