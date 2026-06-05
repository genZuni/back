import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.detector';
import { Role } from 'src/common/enums/role.enum';
import { ESessionStatus } from '../entity/session.entity';
import { SessionService } from './session.service';
import { SessionResponseDto } from './dto/session-response.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@ApiTags('Booking - Teacher')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
@Controller('teacher')
export class TeacherSessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'List my sessions (teacher)' })
  @ApiQuery({ name: 'status', required: false, enum: ESessionStatus })
  @ApiResponse({ status: 200, type: [SessionResponseDto] })
  async getMySessions(
    @Request() req,
    @Query('status') status?: ESessionStatus,
  ): Promise<SessionResponseDto[]> {
    return this.sessionService.getTeacherSessions(req.user.id, status);
  }

  @Patch('sessions/:id/complete')
  @ApiOperation({
    summary: 'Mark a session complete and release payment (teacher)',
    description:
      'Marks the session COMPLETED. For paid sessions the held payment is ' +
      'released to the teacher wallet immediately.',
  })
  @ApiParam({ name: 'id', description: 'Session id (uuid)' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  @ApiResponse({ status: 403, description: 'Not your session.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  @ApiResponse({ status: 409, description: 'Session is not scheduled.' })
  async complete(
    @Request() req,
    @Param('id') id: string,
  ): Promise<SessionResponseDto> {
    return this.sessionService.completeSession(req.user.id, id);
  }
}

@ApiTags('Booking - Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/sessions')
export class AdminSessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Patch(':id/resolve')
  @ApiOperation({
    summary: 'Resolve a disputed/held session (admin)',
    description:
      'Force-release the held payment to the teacher, or refund it to the ' +
      'student and cancel the session.',
  })
  @ApiParam({ name: 'id', description: 'Session id (uuid)' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  @ApiResponse({ status: 400, description: 'No held payment to resolve.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ): Promise<SessionResponseDto> {
    return this.sessionService.resolveDispute(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all sessions (admin)' })
  @ApiResponse({ status: 200, type: [SessionResponseDto] })
  async list(): Promise<SessionResponseDto[]> {
    return this.sessionService.getAllSessions();
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel any scheduled session (admin)' })
  @ApiParam({ name: 'id', description: 'Session id (uuid)' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  @ApiResponse({ status: 409, description: 'Session is not scheduled.' })
  async cancel(@Param('id') id: string): Promise<SessionResponseDto> {
    return this.sessionService.adminCancelSession(id);
  }
}
