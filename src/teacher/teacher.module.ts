import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from 'src/entity/teacher.entity';
import { TeacherLocate } from 'src/entity/teacherLocate.entity';
import { TeacherServies } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { UsersModule } from 'src/users/users.module';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from 'src/entity/category.enity';
import { CategoryLocate } from 'src/entity/categoryLocate.enity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      TeacherLocate,
      Category,
      CategoryLocate,
    ]),
    UsersModule,
  ],
  providers: [TeacherServies, CategoryService],
  controllers: [TeacherController, CategoryController],
})
export class TeacherModule {}
