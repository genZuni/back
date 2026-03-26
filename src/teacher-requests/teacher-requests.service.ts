// src/teacher-requests/teacher-requests.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { CreateTeacherRequestDto } from './dto/create-teacher-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { QueryTeacherRequestsDto } from './dto/query-teacher-requests.dto';
import {
  RequestStatus,
  TeacherRequest,
} from 'src/entity/teacher-request.entity';

@Injectable()
export class TeacherRequestsService {
  constructor(
    @InjectRepository(TeacherRequest)
    private teacherRequestRepository: Repository<TeacherRequest>,
  ) {}

  async create(
    createDto: CreateTeacherRequestDto,
    resumePath?: string,
  ): Promise<TeacherRequest> {
    const request = this.teacherRequestRepository.create({
      ...createDto,
      resumePath,
      status: RequestStatus.PENDING,
    });

    return await this.teacherRequestRepository.save(request);
  }

  async findAll(query: QueryTeacherRequestsDto) {
    const { status, search, page, limit, sortBy, sortOrder } = query;

    const where: FindOptionsWhere<TeacherRequest> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.fullName = Like(`%${search}%`);
    }

    const [data, total] = await this.teacherRequestRepository.findAndCount({
      where,
    //   order: {
    //     [sortBy]: sortOrder,
    //   },
    //   skip: (page - 1) * limit,
    //   take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / (limit||0)),
      },
    };
  }

  async findOne(id: string): Promise<TeacherRequest> {
    const request = await this.teacherRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('درخواست یافت نشد');
    }

    return request;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateRequestStatusDto,
    reviewerId: string,
  ): Promise<TeacherRequest> {
    const request = await this.findOne(id);

    request.status = updateDto.status;
    request.reviewNotes = updateDto.reviewNotes ||"";
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();

    return await this.teacherRequestRepository.save(request);
  }

  
  async getStats() {
    const stats = await this.teacherRequestRepository
      .createQueryBuilder('request')
      .select('request.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.status')
      .getRawMany();

    const total = await this.teacherRequestRepository.count();

    return {
      total,
      stats: stats.reduce((acc, { status, count }) => {
        acc[status] = parseInt(count);
        return acc;
      }, {}),
    };
  }

  async delete(id: string): Promise<void> {
    const request = await this.findOne(id);
    await this.teacherRequestRepository.remove(request);
  }

  async markAsReviewed(
    id: string,
    reviewerId: string,
  ): Promise<TeacherRequest> {
    return this.updateStatus(
      id,
      {
        status: RequestStatus.REVIEWED,
        reviewNotes: 'بررسی شد',
      },
      reviewerId,
    );
  }
}
