import { 
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiResponse,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Creates a new user with the provided information'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully created',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - Email already exists' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Validation failed' 
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return new UserResponseDto(user);
  }

  // ---- self-service ("me") routes — declared before the ":id" routes so
  // ---- "/users/me" is not captured as ":id" by the admin handlers below.

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my own profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@Req() req): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(req.user.id);
    return new UserResponseDto(user);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my own profile (name/email/phone/country)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateMe(
    @Req() req,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateProfile(req.user.id, dto);
    return new UserResponseDto(user);
  }

  @Patch('me/password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change my password' })
  @ApiResponse({ status: 200, description: 'Password updated.' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect.' })
  async changePassword(
    @Req() req,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    await this.usersService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true };
  }

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate (soft-delete) my own account' })
  @ApiResponse({ status: 204, description: 'Account deactivated.' })
  async deleteMe(@Req() req): Promise<void> {
    await this.usersService.deactivate(req.user.id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieves a list of all users (Admin only)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users retrieved successfully',
    type: [UserResponseDto] 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(user => new UserResponseDto(user));
  }

  @Get('teachers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get all teachers',
    description: 'Retrieves a list of all users with teacher role'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of teachers retrieved successfully',
    type: [UserResponseDto] 
  })
  async findTeachers(): Promise<UserResponseDto[]> {
    const teachers = await this.usersService.findByRole(Role.TEACHER);
    return teachers.map(teacher => new UserResponseDto(teacher));
  }

  @Get('students')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get all students',
    description: 'Retrieves a list of all users with student role'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of students retrieved successfully',
    type: [UserResponseDto] 
  })
  async findStudents(): Promise<UserResponseDto[]> {
    const students = await this.usersService.findByRole(Role.STUDENT);
    return students.map(student => new UserResponseDto(student));
  }

  @Get('search')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Search users',
    description: 'Search users by name or email (Admin only)'
  })
  @ApiQuery({ 
    name: 'q', 
    description: 'Search query string',
    required: true,
    example: 'john'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results retrieved successfully',
    type: [UserResponseDto] 
  })
  async searchUsers(@Query('q') query: string): Promise<UserResponseDto[]> {
    const users = await this.usersService.searchUsers(query);
    return users.map(user => new UserResponseDto(user));
  }

  @Get('statistics')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user statistics',
    description: 'Retrieves statistical information about users (Admin only)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        totalUsers: 100,
        activeUsers: 85,
        usersByRole: [
          { role: 'admin', count: 1 },
          { role: 'teacher', count: 10 },
          { role: 'student', count: 89 }
        ]
      }
    }
  })
  async getStatistics() {
    return this.usersService.getStatistics();
  }

  @Get('profile/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user profile',
    description: 'Retrieves detailed information about a specific user'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return new UserResponseDto(user);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update user',
    description: 'Updates an existing user (Admin only)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID to update'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - Email already exists' 
  })
  async update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return new UserResponseDto(user);
  }

  @Patch(':id/balance')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update user balance',
    description: 'Adds or subtracts from user balance (Admin only)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Balance updated successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Insufficient balance' 
  })
  async updateBalance(
    @Param('id') id: string,
    @Body('amount') amount: number
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateBalance(id, amount);
    return new UserResponseDto(user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete user',
    description: 'Permanently deletes a user (Admin only)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User UUID to delete'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'User deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}