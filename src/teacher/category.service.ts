import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Category } from 'src/entity/category.enity';
import { CategoryLocate } from 'src/entity/categoryLocate.enity';
import { Repository } from 'typeorm';
import { createCategory, updateCategory } from './dto/create-category.dto';
import { TranslateService } from 'src/translate/translate.service';
import { ELanguage } from 'src/common/enums/role.enum';
import { TeacherServies } from './teacher.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private CategoryRepository: Repository<Category>,
    @InjectRepository(CategoryLocate)
    private CategoryLocateRepository: Repository<CategoryLocate>,
    private translateService: TranslateService,
    private teacherServices: TeacherServies,
  ) {}

  async create(dto: createCategory) {
    const category = this.CategoryRepository.create({ icon: dto.iconLink });
    await category.save();
    const translated = await this.translateService.translate({
      category,
      title: dto.title,
    });
    await this.CategoryLocateRepository.save(
      translated.map((el) => {
        return { ...el.data, locate: el.lang };
      }),
    );
  }
  async update(dto: updateCategory, id: string) {
    const cat = await this.one(id);
    // Object.assign(cat, dto);
    await cat.save();
  }
  async delete(id: string) {
    const cat = await this.one(id);
    await this.CategoryRepository.remove(cat);
  }
  async list(lang?: ELanguage) {
    const list = await this.CategoryRepository.find({
      where: { locates: { locate: lang } },
      relations: { locates: true, teachers: true },
    });
    return list;
  }
  async one(id: string, lang?: ELanguage) {
    const item = await this.CategoryRepository.findOne({
      where: { id, locates: { locate: lang } },
      relations: { locates: true, teachers: true },
    });
    if (!item) throw new NotFoundException('category could not found');
    return item;
  }
  async addTeacher(catId: string, teacherId: string) {
    const teacher = await this.teacherServices.findOne(teacherId);
    const cat = await this.one(catId);
    teacher['category'] = cat;
    await teacher.save();
  }
}
