// src/teacher-requests/teacher-requests.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherRequestsController } from './teacher-requests.controller';
import { TeacherRequestsService } from './teacher-requests.service';
import { TeacherRequest } from 'src/entity/teacher-request.entity';


@Module({
  imports: [TypeOrmModule.forFeature([TeacherRequest])],
  controllers: [TeacherRequestsController],
  providers: [TeacherRequestsService],
  exports: [TeacherRequestsService],
})
export class TeacherRequestsModule {}