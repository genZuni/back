// src/teacher-requests/teacher-requests.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
// import { diskStorage } from 'multer';
import { extname } from 'path';
import { TeacherRequestsService } from './teacher-requests.service';
import { CreateTeacherRequestDto } from './dto/create-teacher-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { QueryTeacherRequestsDto } from './dto/query-teacher-requests.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';


@ApiTags('teacher-requests')
@Controller('teacher-requests')
export class TeacherRequestsController {
  constructor(private readonly teacherRequestsService: TeacherRequestsService) {}


  @Post()
  @ApiOperation({ summary: 'Submit a new teacher request' })
  @ApiResponse({ status: 201, description: 'Request submitted successfully' })
//   @ApiConsumes('multipart/form-data')
//   @UseInterceptors(
//     FileInterceptor('resume', {
//       storage: diskStorage({
//         destination: './uploads/resumes',
//         filename: (req, file, callback) => {
//           const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//           const ext = extname(file.originalname);
//           callback(null, `${uniqueSuffix}${ext}`);
//         },
//       }),
//       fileFilter: (req, file, callback) => {
//         if (!file.originalname.match(/\.(pdf)$/)) {
//           return callback(new Error('Only PDF files are allowed!'), false);
//         }
//         callback(null, true);
//       },
//       limits: {
//         fileSize: 5 * 1024 * 1024, // 5MB
//       },
//     }),
//   )
  async create(
    @Body() createDto: CreateTeacherRequestDto,
    // @UploadedFile() file?: Express.Multer.File,
  ) {
    const resumePath = undefined;
    // const resumePath = file ? `/uploads/resumes/${file.filename}` : undefined;
    return await this.teacherRequestsService.create(createDto, resumePath);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all teacher requests (Admin only)' })
  async findAll(@Query() query: QueryTeacherRequestsDto) {
    return await this.teacherRequestsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get request statistics' })
  async getStats() {
    return await this.teacherRequestsService.getStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific teacher request' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.teacherRequestsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update request status (Admin only)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRequestStatusDto,
    @Req() req: any,
  ) {
    return await this.teacherRequestsService.updateStatus(id, updateDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark request as reviewed' })
  async markAsReviewed(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return await this.teacherRequestsService.markAsReviewed(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a teacher request (Admin only)' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.teacherRequestsService.delete(id);
    return { message: 'Request deleted successfully' };
  }
}