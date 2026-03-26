import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique user identifier'
  })
  id: string;

  @Expose()
  @ApiProperty({ 
    example: 'John Doe',
    description: 'User full name'
  })
  name: string;

  @Expose()
  @ApiProperty({ 
    example: 'john@example.com',
    description: 'User email address'
  })
  email: string;

  @Expose()
  @ApiProperty({ 
    example: '+1234567890', 
    required: false,
    description: 'User phone number'
  })
  phone?: string;

  @Expose()
  @ApiProperty({ 
    example: 'USA', 
    required: false,
    description: 'User country'
  })
  country?: string;

  @Expose()
  @ApiProperty({ 
    example: 1000.50,
    description: 'User account balance'
  })
  balance: number;

  @Expose()
  @ApiProperty({ 
    enum: Role,
    example: Role.STUDENT,
    description: 'User role'
  })
  role: Role;

  @Expose()
  @ApiProperty({ 
    example: true,
    description: 'Whether the user account is active'
  })
  isActive: boolean;

  @Expose()
  @ApiProperty({ 
    example: '2024-01-01T00:00:00Z',
    description: 'Account creation date'
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({ 
    example: '2024-01-01T00:00:00Z',
    description: 'Last update date'
  })
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}