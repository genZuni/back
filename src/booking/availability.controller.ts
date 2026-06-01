import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.detector';
import { Role } from 'src/common/enums/role.enum';
import { AvailabilityService } from './availability.service';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import {
  AvailableSlotDto,
  AvailableSlotsQueryDto,
} from './dto/available-slots-query.dto';

@ApiTags('Booking - Availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post('availability')
  @Roles(Role.TEACHER)
  @ApiOperation({
    summary: 'Set my weekly availability (teacher)',
    description: 'Replaces the entire weekly schedule with the given windows.',
  })
  @ApiResponse({ status: 201, type: [AvailabilityResponseDto] })
  async setAvailability(
    @Request() req,
    @Body() dto: SetAvailabilityDto,
  ): Promise<AvailabilityResponseDto[]> {
    return this.availabilityService.setAvailability(req.user.id, dto);
  }

  @Get('availability')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Get my weekly availability (teacher)' })
  @ApiResponse({ status: 200, type: [AvailabilityResponseDto] })
  async getMyAvailability(
    @Request() req,
  ): Promise<AvailabilityResponseDto[]> {
    return this.availabilityService.getAvailability(req.user.id);
  }

  @Delete('availability/:id')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Remove one availability window (teacher)' })
  @ApiParam({ name: 'id', description: 'Availability window id (uuid)' })
  @ApiResponse({ status: 200, description: 'Window removed.' })
  @ApiResponse({ status: 403, description: 'Not your availability.' })
  @ApiResponse({ status: 404, description: 'Window not found.' })
  async removeAvailability(
    @Request() req,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    await this.availabilityService.removeAvailability(req.user.id, id);
    return { success: true };
  }

  @Get(':id/available-slots')
  @ApiOperation({
    summary: 'Get a teacher bookable slots',
    description:
      'Generates open slots from the teacher availability minus existing ' +
      'bookings. Times are UTC. Defaults to the next 14 days.',
  })
  @ApiParam({ name: 'id', description: 'Teacher id (= teacher user id)' })
  @ApiResponse({ status: 200, type: [AvailableSlotDto] })
  @ApiResponse({ status: 404, description: 'Teacher not found.' })
  async getAvailableSlots(
    @Param('id') teacherId: string,
    @Query() query: AvailableSlotsQueryDto,
  ): Promise<AvailableSlotDto[]> {
    return this.availabilityService.getAvailableSlots(
      teacherId,
      query.from,
      query.to,
    );
  }
}
