// category.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { createCategory, updateCategory } from './dto/create-category.dto';

import { ELanguage } from '../common/enums/role.enum';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category with translations' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
    // type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  // @UseGuards(JwtAuthGuard) // uncomment if authentication required
  async create(@Body() dto: createCategory) {
    const created = await this.categoryService.create(dto);
    return created; // assuming service returns the created category
  }

  @Get()
  @ApiOperation({
    summary: 'Get all categories (optionally filtered by language)',
  })
  //   @ApiQuery({
  //     name: 'lang',
  //     enum: ELanguage,
  //     required: false,
  //     description: 'Language code to filter by',
  //     example: ELanguage.EN,
  //   })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of categories',
    // type: [CategoryResponseDto],
  })
  async list(@Param('lang') lang?: ELanguage) {
    return this.categoryService.list(lang);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single category by ID (optionally with specific language)',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  //   @ApiQuery({
  //     name: 'lang',
  //     enum: ELanguage,
  //     required: false,
  //     description: 'Language code for the translation',
  //     example: ELanguage.EN,
  //   })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category found',
    // type: CategoryDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async one(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lang') lang?: ELanguage,
  ) {
    return this.categoryService.one(id, lang);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
    // type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  // @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: updateCategory,
  ) {
    return this.categoryService.update(dto, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  // @UseGuards(JwtAuthGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.categoryService.delete(id);
  }
  @Patch('teacher/:catId/:teacherId')
  async addTeacher(
    @Param('catId', ParseUUIDPipe) catId: string,
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
  ) {
    return this.categoryService.addTeacher(catId, teacherId);
  }
}
