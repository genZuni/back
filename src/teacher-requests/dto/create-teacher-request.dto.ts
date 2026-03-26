// src/teacher-requests/dto/create-teacher-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  IsEnum,
  IsUrl,
  ArrayMinSize,
  IsNotEmpty,
  MaxLength,
  MinLength
} from 'class-validator';
import { EnglishLevel } from 'src/entity/teacher-request.entity';


export class CreateTeacherRequestDto {
  @ApiProperty({
    description: 'Full name of the applicant',
    example: 'John Doe',
    required: true
  })
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است' })
  @IsString({ message: 'نام و نام خانوادگی باید متن باشد' })
  @MinLength(3, { message: 'نام و نام خانوادگی حداقل ۳ کاراکتر باید باشد' })
  @MaxLength(100, { message: 'نام و نام خانوادگی حداکثر ۱۰۰ کاراکتر باید باشد' })
  fullName: string;

  @ApiProperty({
    description: 'Subjects you want to teach',
    example: 'ریاضی، فیزیک، برنامه نویسی',
    required: true
  })
  @IsNotEmpty({ message: 'کلاس یا کلاسهایی که مایل به درس دادن هستید الزامی است' })
  @IsString({ message: 'موضوع تدریس باید متن باشد' })
  subject: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
    required: true
  })
  @IsNotEmpty({ message: 'آدرس ایمیل الزامی است' })
  @IsEmail({}, { message: 'لطفا یک ایمیل معتبر وارد کنید' })
  email: string;

  @ApiProperty({
    description: 'WhatsApp-connected mobile number',
    example: '+989123456789',
    required: true
  })
  @IsNotEmpty({ message: 'شماره موبایلی که به واتساپ وصل باشد الزامی است' })
  @IsPhoneNumber("IR", { message: 'لطفا یک شماره تلفن معتبر وارد کنید' })
  phone: string;

  @ApiProperty({
    description: 'City and Country of Residence',
    example: 'تهران، ایران',
    required: true
  })
  @IsNotEmpty({ message: 'شهر و کشور محل سکونت الزامی است' })
  @IsString({ message: 'شهر و کشور محل سکونت باید متن باشد' })
  residenceCountry: string;

  @ApiProperty({
    description: 'How you heard about us',
    example: 'از طریق دوستم علی',
    required: true
  })
  @IsNotEmpty({ message: 'روش آشناییتان با ما الزامی است' })
  @IsString({ message: 'روش آشنایی باید متن باشد' })
  howLearnedAboutUs: string;

  @ApiProperty({
    description: 'Ability to teach in English',
    enum: EnglishLevel,
    example: EnglishLevel.ADVANCED,
    required: true
  })
  @IsNotEmpty({ message: 'توانایی تدریس به زبان انگلیسی الزامی است' })
  @IsEnum(EnglishLevel, { message: 'لطفا یک سطح معتبر انتخاب کنید' })
  englishLevel: EnglishLevel;

  @ApiProperty({
    description: 'Personal website or LinkedIn/Instagram profile',
    example: 'https://linkedin.com/in/johndoe',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'لطفا یک آدرس معتبر وارد کنید' })
  socialMedia?: string;

  @ApiProperty({
    description: 'In-person teaching experience',
    example: '۵ سال تدریس در مدارس',
    required: true
  })
  @IsNotEmpty({ message: 'تجربه‌ی‌ تدریس حضوری الزامی است' })
  @IsString({ message: 'تجربه تدریس حضوری باید متن باشد' })
  teachingExperience: string;

  @ApiProperty({
    description: 'Online teaching experience',
    example: '۲ سال تدریس آنلاین',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'تجربه تدریس آنلاین باید متن باشد' })
  onlineTeachingExperience?: string;

  @ApiProperty({
    description: 'Experience teaching Persian speakers worldwide',
    example: 'تدریس به دانش‌آموزان افغانستانی',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'تجربه تدریس به فارسی‌زبانان باید متن باشد' })
  foreignTeachingExperience?: string;

  @ApiProperty({
    description: 'Academic degree and university',
    example: 'کارشناسی ارشد کامپیوتر - دانشگاه تهران',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'مدرک تحصیلی باید متن باشد' })
  degreeOfEducation?: string;

  @ApiProperty({
    description: 'Session duration in minutes',
    example: 60,
    minimum: 30,
    maximum: 180,
    required: true
  })
  @IsNotEmpty({ message: 'مدت زمان هر جلسه الزامی است' })
  @IsNumber({}, { message: 'مدت زمان باید عدد باشد' })
  @Min(30, { message: 'مدت زمان حداقل ۳۰ دقیقه باید باشد' })
  @Max(180, { message: 'مدت زمان حداکثر ۱۸۰ دقیقه باید باشد' })
  duration: number;

  @ApiProperty({
    description: 'Price per session in CAD',
    example: 50,
    minimum: 10,
    maximum: 200,
    required: true
  })
  @IsNotEmpty({ message: 'هزینه‌ی هر جلسه الزامی است' })
  @IsNumber({}, { message: 'هزینه باید عدد باشد' })
  @Min(10, { message: 'هزینه حداقل ۱۰ دلار کانادا باید باشد' })
  @Max(200, { message: 'هزینه حداکثر ۲۰۰ دلار کانادا باید باشد' })
  price: number;

  @ApiProperty({
    description: 'Student age groups',
    example: ['6-12', '12-18', '18-65'],
    enum: ['4-6', '6-12', '12-18', '18-65', '65-up'],
    required: true
  })
  @IsNotEmpty({ message: 'گروه سنی شاگرد الزامی است' })
  @IsArray({ message: 'گروه سنی باید به صورت آرایه باشد' })
  @ArrayMinSize(1, { message: 'حداقل یک گروه سنی باید انتخاب کنید' })
  @IsString({ each: true })
  ageGroup: string[];

  @ApiProperty({
    description: 'Achievements/Awards',
    example: 'برگزیده جشنواره خوارزمی',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'افتخارات باید متن باشد' })
  honors?: string;

  @ApiProperty({
    description: 'Additional information',
    example: 'علاقه مند به تدریس به نوجوانان',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'اطلاعات اضافی باید متن باشد' })
  note?: string;
}