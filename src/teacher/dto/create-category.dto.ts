// dto/create-category.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

export class createCategory {
  @ApiProperty({
    description: 'Category title',
    example: 'Mathematics',
    required: true,
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MinLength(2, { message: 'Title must be at least 2 characters long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @ApiProperty({
    description: 'Icon URL or path',
    example: 'https://example.com/icons/math.png',
    required: true,
  })
  @IsNotEmpty({ message: 'Icon link is required' })
  @IsUrl({}, { message: 'Icon link must be a valid URL' })
  @IsString({ message: 'Icon link must be a string' })
  iconLink: string;
}

export class updateCategory extends PartialType(createCategory) {}
