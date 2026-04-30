// ticket.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageReadStatus } from 'src/entity/message-read-status.entity';
import { Message } from 'src/entity/message.entity';
import { Ticket } from 'src/entity/ticket.entity';
import { User } from 'src/entity/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Repository, Like, In, Not } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(MessageReadStatus)
    private readStatusRepo: Repository<MessageReadStatus>,
    private notificationService: NotificationService,
  ) {}

  async createTicket(user: User, dto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepo.create({
      title: dto.title,
      description: dto.description,
      createdBy: user,
    });
    const saved = await this.ticketRepo.save(ticket);

    // ارسال نوتیفیکیشن به ادمین‌ها و معلم‌ها
    await this.notificationService.notifyNewTicket(saved, user);

    return saved;
  }

  async getTickets(user: User, query: TicketQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // جستجو بر اساس عنوان و توضیحات
    if (search) {
      where.title = Like(`%${search}%`);
      // می‌توانید جستجو را گسترش دهید
    }

    // اگر کاربر دانش‌آموز است، فقط تیکت‌های خودش را ببیند
    if (user.role === 'student') {
      where.createdBy = { id: user.id };
    }

    const [tickets, total] = await this.ticketRepo.findAndCount({
      where,
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // اضافه کردن تعداد پیام‌های نخوانده برای کاربر (اگر ادمین یا معلم باشد)
    const unreadCounts = await this.getUnreadCountsForTickets(
      user,
      tickets.map((t) => t.id),
    );

    const data = tickets.map((ticket) => ({
      ...ticket,
      unreadCount: unreadCounts[ticket.id] || 0,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketById(user: User, id: string) {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['createdBy', 'messages', 'messages.sender'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // دسترسی: دانش‌آموز فقط به تیکت خودش
    if (user.role === 'student' && ticket.createdBy.id !== user.id) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    // اگر کاربر ادمین یا معلم است، پیام‌ها را به عنوان خوانده شده علامت بزن (اختیاری)
    if (user.role !== 'student') {
      await this.markMessagesAsReadForUser(ticket.id, user.id);
    }

    // محاسبه تعداد پیام‌های نخونده برای نمایش (اختیاری)
    const unreadCount = await this.getUnreadCountForTicket(ticket.id, user.id);

    return {
      ...ticket,
      unreadCount: user.role !== 'student' ? unreadCount : 0,
    };
  }

  async updateTicketStatus(user: User, id: string, dto: UpdateTicketStatusDto) {
    // فقط ادمین و معلم می‌توانند وضعیت را تغییر دهند
    if (user.role === 'student') {
      throw new ForbiddenException(
        'Only admins and teachers can change ticket status',
      );
    }

    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    ticket.status = dto.status;
    await this.ticketRepo.save(ticket);

    // ارسال نوتیفیکیشن به ایجادکننده تیکت
    await this.notificationService.notifyTicketStatusChanged(ticket, user);

    return ticket;
  }

  async sendMessage(user: User, ticketId: string, dto: SendMessageDto) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['createdBy'],
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // دسترسی: دانش‌آموز فقط به تیکت خودش، ادمین و معلم به همه
    if (user.role === 'student' && ticket.createdBy.id !== user.id) {
      throw new ForbiddenException('You cannot send message to this ticket');
    }

    const message = this.messageRepo.create({
      content: dto.content,
      fileUrl: dto.fileUrl,
      ticket,
      sender: user,
    });
    await this.messageRepo.save(message);

    // ارسال نوتیفیکیشن به طرف مقابل
    const recipient =
      user.role === 'student' ? await this.getSupportUsers() : ticket.createdBy;
    await this.notificationService.notifyNewMessage(ticket, message, recipient);

    return message;
  }

  async getMessages(user: User, ticketId: string, page = 1, limit = 50) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    if (user.role === 'student' && ticket.createdBy.id !== user.id) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { ticket: { id: ticketId } },
      // relations: ['sender', 'readStatuses'],
      relations: { sender: true, readStatuses: { user: true } },
      order: { createdAt: 'DESC' }, // برای نمایش آخرین پیام اول
      skip: (page - 1) * limit,
      take: limit,
    });

    // اگر کاربر ادمین یا معلم است، پیام‌ها را به عنوان خوانده شده علامت بزن
    if (user.role !== 'student') {
      await this.markMessagesAsReadForUser(ticketId, user.id);
    }

    // برای هر پیام مشخص کن که توسط کاربر خوانده شده یا نه
    const messagesWithReadStatus = messages.map((msg) => ({
      ...msg,
      isReadByCurrentUser: msg.readStatuses.some((rs) => {
        return rs.user.id === user.id;
      }),
    }));

    return {
      data: messagesWithReadStatus,
      // messages,/
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async markMessagesAsReadForUser(ticketId: string, userId: string) {
    const messages = await this.messageRepo.find({
      where: { ticket: { id: ticketId } },
      // relations: ['readStatuses', 'ticket'],
      relations: { readStatuses: true, ticket: true },
    });

    const messageIds = messages.map((m) => m.id);
    const existingReads = await this.readStatusRepo.find({
      where: { user: { id: userId }, message: { id: In(messageIds) } },
      relations: { message: true },
    });
    console.log(existingReads);
    const existingMessageIds = new Set(
      existingReads.map((rs) => rs.message.id),
    );

    const newReadStatuses = messages
      .filter((m) => !existingMessageIds.has(m.id))
      .map((m) =>
        this.readStatusRepo.create({
          message: m,
          user: { id: userId } as any,
          seenAt: new Date(),
        }),
      );

    if (newReadStatuses.length) {
      await this.readStatusRepo.save(newReadStatuses);
    }
  }

  async getUnreadCountForTicket(
    ticketId: string,
    userId: string,
  ): Promise<number> {
    const messages = await this.messageRepo.find({
      where: { ticket: { id: ticketId } },
      relations: ['readStatuses'],
    });
    const readMessageIds = new Set(
      messages
        .flatMap((m) => m.readStatuses)
        .filter((rs) => rs.user.id === userId)
        .map((rs) => rs.message.id),
    );
    return messages.filter((m) => !readMessageIds.has(m.id)).length;
  }

  async getUnreadCountsForTickets(
    user: User,
    ticketIds: string[],
  ): Promise<Record<string, number>> {
    if (user.role === 'student') return {};
    if (!ticketIds.length) return {};

    const messages = await this.messageRepo.find({
      where: { ticket: { id: In(ticketIds) } },
      relations: ['readStatuses', 'readStatuses.user', 'ticket'], // Add user relation
    });
    console.log('object');
    const counts: Record<string, number> = {};
    for (const ticketId of ticketIds) {
      const ticketMessages = messages.filter((m) => m?.ticket?.id === ticketId);
      const readMessageIds = new Set(
        ticketMessages
          .flatMap((m) => m.readStatuses || []) // Handle null/undefined
          .filter((rs) => rs.user && rs.user.id === user.id) // Check if user exists
          .map((rs) => rs?.message?.id),
      );
      counts[ticketId] = ticketMessages.filter(
        (m) => !readMessageIds.has(m?.id),
      ).length;
    }

    return counts;
  }

  private async getSupportUsers() {
    // فرض می‌کنیم کاربرانی با نقش admin و teacher وجود دارند
    // return await this..find({
    //   where: { role: In(['admin', 'teacher']) },
    // });
    return [];
  }

  // ticket.service.ts - add this method

  async getMyTickets(user: User, query: TicketQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;
    const where: any = {
      createdBy: { id: user.id },
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.title = Like(`%${search}%`);
    }

    console.log(where);
    const [tickets, total] = await this.ticketRepo.findAndCount({
      where,
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get unread counts for user (if user is admin/teacher, they see unread messages)
    const unreadCounts =
      user.role !== 'student'
        ? await this.getUnreadCountsForTickets(
            user,
            tickets.map((t) => t.id),
          )
        : {};

    const data = tickets.map((ticket) => ({
      ...ticket,
      unreadCount: unreadCounts[ticket.id] || 0,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
