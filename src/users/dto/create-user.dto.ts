import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsEnum, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsNumber,
  IsPhoneNumber,
  Min 
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ 
    example: 'John Doe',
    description: 'Full name of the user'
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ 
    example: 'john@example.com',
    description: 'User email address'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: '+1234567890', 
    required: false,
    description: 'Phone number with country code'
  })
  @IsOptional()
//   @IsPhoneNumber(null)
  phone?: string;

  @ApiProperty({ 
    example: 'USA', 
    required: false,
    description: 'User country'
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password - minimum 6 characters'
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    enum: Role, 
    default: Role.STUDENT,
    description: 'User role in the system'
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ 
    example: 0, 
    required: false, 
    default: 0,
    description: 'Initial account balance'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}