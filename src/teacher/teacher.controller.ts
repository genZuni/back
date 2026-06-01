// teacher.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Request,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TeacherServies } from './teacher.service';
import { ELanguage } from 'src/common/enums/role.enum';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.detector';

@ApiTags('Teachers')
@Controller('teachers')
export class TeacherController {
  constructor(private teacherServices: TeacherServies) {}

  @Patch('add/:id')
  @ApiOperation({ summary: 'Add user to teacher' })
  @ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User added to teacher successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Teacher not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  addUser(@Param('id',) id: string) {
    return this.teacherServices.addUser(id);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all teachers with filters' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by title or description',
    example: 'math',
  })
  @ApiQuery({
    name: 'lang',
    enum: ELanguage,
    required: false,
    description: 'Filter by language',
    example: ELanguage.EN,
  })
  @ApiQuery({
    name: 'catId',
    required: false,
    description: 'Filter by category ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of teachers',
    // type: TeacherListResponseDto,
  })
  all(
    @Query('search') search?: string,
    @Query('lang') locate?: ELanguage,
    @Query('catId') catId?: string,
  ) {
    return this.teacherServices.teacherList(search, locate, catId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current teacher profile' })
  @ApiQuery({
    name: 'lang',
    enum: ELanguage,
    required: false,
    description: 'Language for translations',
    example: ELanguage.EN,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current teacher profile',
    // type: TeacherResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Teacher not found',
  })
  me(@Request() req, @Query('lang') locate?: ELanguage) {
    return this.teacherServices.findOne(req.user.id, locate);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Get('detail/:id')
  @ApiOperation({ summary: 'Get teacher details by ID' })
  @ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'lang',
    enum: ELanguage,
    required: false,
    description: 'Language for translations',
    example: ELanguage.EN,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher details',
    // type: TeacherResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Teacher not found',
  })
  detail(
    @Param('id',) id: string,
    @Query('lang') locate?: ELanguage,
  ) {
    return this.teacherServices.findOne(id, locate);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @ApiBearerAuth()
  @Put('update/:id')
  @ApiOperation({ summary: 'Update teacher information' })
  @ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher updated successfully',
    // type: TeacherResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Teacher not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  update(
    @Param('id',) id: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teacherServices.update(dto, id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a teacher' })
  @ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Teacher deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Teacher not found',
  })
  delete(@Param('id',) id: string) {
    // return this.teacherServices.delete(id);
  }
}
