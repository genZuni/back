// dto/update-teacher.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsEnum,
  IsUrl,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { TEnglishLevel } from 'src/entity/teacher.entity';

export class UpdateTeacherDto {
  @ApiProperty({
    description: 'Teacher title',
    example: 'Expert Math Teacher',
    required: false,
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string;

  @ApiProperty({
    description: 'Teacher description',
    example: 'Experienced math teacher with 10 years of experience',
    required: false,
    minLength: 10,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Minutes per session',
    example: 60,
    required: false,
    minimum: 30,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minutes per session must be a number' })
  @Min(30, { message: 'Minutes per session must be at least 30 minutes' })
  @Max(180, { message: 'Minutes per session must not exceed 180 minutes' })
  minutePerSession?: number;

  @ApiProperty({
    description: 'Teacher photo URL',
    example: 'https://example.com/photos/teacher.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Photo must be a valid URL' })
  @IsString({ message: 'Photo must be a string' })
  photo?: string;

  @ApiProperty({
    description: 'Price per session',
    example: 50,
    required: false,
    minimum: 10,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(10, { message: 'Price must be at least $10' })
  @Max(200, { message: 'Price must not exceed $200' })
  price?: number;

  @ApiProperty({
    description: 'Student age groups',
    example: ['6-12', '12-18', '18-65'],
    enum: ['4-6', '6-12', '12-18', '18-65', '65-up'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Ages must be an array' })
  @ArrayMinSize(1, { message: 'At least one age group must be selected' })
  @IsString({ each: true, message: 'Each age group must be a string' })
  ages?: string[];

  @ApiProperty({
    description: 'English proficiency level',
    enum: TEnglishLevel,
    example: TEnglishLevel.good,
    required: false,
  })
  @IsOptional()
  @IsEnum(TEnglishLevel, { message: 'Invalid English level' })
  englishLevel?: TEnglishLevel;
}