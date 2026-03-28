import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  IsPhoneNumber, 
  IsNotEmpty,
  Matches 
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email: string;


    @ApiProperty({
    description: 'Name',
    example: 'name',
    required: true,
  })
  @IsNotEmpty({ message: 'Name is required' })
  // @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  name: string;


  @ApiProperty({
    description: 'User password',
    example: 'StrongP@ssw0rd123',
    required: true,
    minLength: 6,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
  //   message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  // })
  password: string;

  @ApiProperty({
    description: 'User phone number with country code',
    example: '+989123456789',
    required: true,
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  // @IsPhoneNumber('IR', { message: 'Please provide a valid phone number with country code' })
  // @Matches(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/, {
  //   message: 'Please provide a valid phone number',
  // })
  phone: string;
}