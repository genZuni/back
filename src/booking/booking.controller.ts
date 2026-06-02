import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.detector';
import { Role } from 'src/common/enums/role.enum';
import { ESessionStatus } from '../entity/session.entity';
import { BookingService } from './booking.service';
import { TrialBookDto } from './dto/trial-book.dto';
import { PaidBookDto } from './dto/paid-book.dto';
import { SessionResponseDto } from './dto/session-response.dto';

@ApiTags('Booking - Student')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller('student')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('trial-book')
  @ApiOperation({
    summary: 'Book my free trial session with a teacher (student)',
    description: 'Exactly one free trial is allowed per teacher.',
  })
  @ApiResponse({ status: 201, type: SessionResponseDto })
  @ApiResponse({ status: 409, description: 'Trial already booked / slot taken.' })
  async bookTrial(
    @Request() req,
    @Body() dto: TrialBookDto,
  ): Promise<SessionResponseDto> {
    return this.bookingService.bookTrial(req.user.id, dto);
  }

  @Post('paid-book')
  @ApiOperation({
    summary: 'Book one or more paid sessions (student)',
    description:
      'Requires a completed trial with the teacher. Books one session per ' +
      'selected slot and holds the total in escrow until each is completed.',
  })
  @ApiResponse({ status: 201, type: [SessionResponseDto] })
  @ApiResponse({ status: 400, description: 'Insufficient wallet balance.' })
  @ApiResponse({ status: 403, description: 'Trial not completed yet.' })
  @ApiResponse({ status: 409, description: 'One or more slots are taken.' })
  async bookPaid(
    @Request() req,
    @Body() dto: PaidBookDto,
  ): Promise<SessionResponseDto[]> {
    return this.bookingService.bookPaid(req.user.id, dto);
  }

  @Patch('sessions/:id/cancel')
  @ApiOperation({
    summary: 'Cancel one of my scheduled sessions (student)',
    description:
      'Refunds any held payment to the wallet. Only future, still-scheduled ' +
      'sessions can be cancelled.',
  })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  @ApiResponse({ status: 400, description: 'Session is not cancellable.' })
  @ApiResponse({ status: 403, description: 'Session belongs to another user.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async cancelSession(
    @Request() req,
    @Param('id') id: string,
  ): Promise<SessionResponseDto> {
    return this.bookingService.cancelSession(req.user.id, id);
  }

  @Patch('sessions/:id/confirm')
  @ApiOperation({
    summary: 'Confirm a past session took place (student)',
    description:
      'Marks the session completed and releases the held payment to the ' +
      'teacher. Allowed only after the session end time has passed.',
  })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  @ApiResponse({ status: 400, description: 'Session is not confirmable yet.' })
  @ApiResponse({ status: 403, description: 'Session belongs to another user.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async confirmSession(
    @Request() req,
    @Param('id') id: string,
  ): Promise<SessionResponseDto> {
    return this.bookingService.confirmSession(req.user.id, id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List my sessions (student)' })
  @ApiQuery({ name: 'status', required: false, enum: ESessionStatus })
  @ApiResponse({ status: 200, type: [SessionResponseDto] })
  async getMySessions(
    @Request() req,
    @Query('status') status?: ESessionStatus,
  ): Promise<SessionResponseDto[]> {
    return this.bookingService.getStudentSessions(req.user.id, status);
  }
}
