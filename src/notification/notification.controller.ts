import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.detector';
import { Role } from 'src/common/enums/role.enum';
import { ENotificationType } from 'src/entity/notification.entity';
import { NotificationService } from './notification.service';
import { BroadcastDto } from './dto/broadcast.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: broadcast a notification to an audience' })
  async broadcast(@Body() dto: BroadcastDto) {
    return this.notificationService.broadcast(dto.audience, {
      title: dto.title,
      body: dto.body,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List my notifications (newest first)' })
  @ApiQuery({ name: 'isRead', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'type', required: false, enum: ENotificationType })
  list(
    @Request() req,
    @Query('isRead') isRead?: string,
    @Query('type') type?: ENotificationType,
  ) {
    const read = isRead === undefined ? undefined : isRead === 'true';
    return this.notificationService.listForUser(req.user.id, {
      isRead: read,
      type,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count my unread notifications' })
  async unreadCount(@Request() req) {
    return { count: await this.notificationService.unreadCount(req.user.id) };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  async markAllRead(@Request() req) {
    await this.notificationService.markAllRead(req.user.id);
    return { success: true };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  markRead(@Request() req, @Param('id') id: string) {
    return this.notificationService.markRead(req.user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete one of my notifications' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.notificationService.remove(req.user.id, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all my notifications' })
  async removeAll(@Request() req) {
    await this.notificationService.removeAll(req.user.id);
  }
}
