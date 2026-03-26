import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ELanguage, Role } from 'src/common/enums/role.enum';
import { Teacher } from 'src/entity/teacher.entity';
import { TeacherLocate } from 'src/entity/teacherLocate.entity';
import { NotificationService } from 'src/notification/notification.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TranslateService } from 'src/translate/translate.service';

@Injectable()
export class TeacherServies {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(TeacherLocate)
    private teacherLocateRepository: Repository<TeacherLocate>,
    private readonly userService: UsersService,
    private readonly notifService: NotificationService,
    private readonly TranslateService: TranslateService,
  ) {}
  async addUser(userId: string) {
    const user = await this.userService.findOne(userId);
    user['role'] = Role.TEACHER;
    await user.save();
    const teacher = this.teacherRepository.create({ user });
    await teacher.save();
    await this.notifService.sendNotification(
      userId,
      'کاربر گرامی شما به سطح تیچر تغییر کردید',
    );
  }
  async teacherList(search?: string, locate?: ELanguage, catId?: string) {
    const teacherList = await this.teacherRepository.find({
      where: { locates: { locate }, category: { id: catId } },
      relations: { locates: true, category: true },
    });
    return teacherList;
  }
  async findOne(id: string, locate?: ELanguage) {
    const data = await this.teacherRepository.findOne({
      where: { id, locates: { locate } },
      relations: { locates: true, category: true },
    });
    if (!data) {
      throw new NotFoundException('teacher could not found');
    }
    return data;
  }
  async update(
    {
      ages,
      description,
      englishLevel,
      minutePerSession,
      photo,
      price,
      title,
    }: UpdateTeacherDto,
    id: string,
  ) {
    const teacher = await this.findOne(id);
    await this.teacherLocateRepository.delete({ teacher });
    Object.assign(teacher, {
      minutePerSession,
      photo,
      price,
      ages: ages ? JSON.stringify(ages) : undefined,
      englishLevel,
    });
    await teacher.save();
    const translate = await this.TranslateService.translate({
      discription: description,
      title,
    });
    await this.teacherLocateRepository.save(
      translate.map((el) => {
        return {
          teacher,
          title: el.data.title,
          discription: el.data.discription,
          locate: el.lang,
        };
      }),
    );
  }
}
