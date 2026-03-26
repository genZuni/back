// ticket.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.detector';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get tickets created by current user' })
  @ApiResponse({ status: 200, description: 'List of user tickets' })
  async getMyTickets(@Request() req, @Query() query: TicketQueryDto) {
    return this.ticketService.getMyTickets(req.user, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async createTicket(@Request() req, @Body() dto: CreateTicketDto) {
    return this.ticketService.createTicket(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get tickets list with search and pagination' })
  async getTickets(@Request() req, @Query() query: TicketQueryDto) {
    return this.ticketService.getTickets(req.user, query);
  }

  @Get('detail/:id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Get ticket details with messages' })
  async getTicketById(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.ticketService.getTicketById(req.user, id);
  }

  @Patch(':id/status')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Update ticket status (admin/teacher only)' })
  @Roles('admin', 'teacher')
  @UseGuards(RolesGuard)
  async updateTicketStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.ticketService.updateTicketStatus(req.user, id, dto);
  }

  @Post(':id/messages')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Send a message in ticket' })
  async sendMessage(
    @Request() req,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.ticketService.sendMessage(req.user, ticketId, dto);
  }

  @Get(':id/messages')
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({
    summary: 'Get messages of a ticket (sorted by latest first)',
  })
  async getMessages(
    @Request() req,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.ticketService.getMessages(req.user, ticketId, +page, +limit);
  }
}
