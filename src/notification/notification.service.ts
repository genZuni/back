import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Message } from 'src/entity/message.entity';
import { Ticket } from 'src/entity/ticket.entity';
import { User } from 'src/entity/user.entity';
import {
  ENotificationType,
  Notification,
} from 'src/entity/notification.entity';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Admin: broadcast a notification to an audience ('all' or a single role).
   * Creates one notification row per matching user.
   */
  async broadcast(
    audience: 'all' | 'student' | 'teacher' | 'admin',
    data: { title: string; body?: string },
  ): Promise<{ sentCount: number; audience: string }> {
    const users = await this.userRepo.find({
      where: audience === 'all' ? {} : { role: audience as Role },
      select: ['id'],
    });

    if (users.length) {
      const rows = users.map((u) =>
        this.repo.create({
          userId: u.id,
          type: ENotificationType.SYSTEM,
          title: data.title,
          body: data.body,
        }),
      );
      await this.repo.save(rows);
    }

    return { sentCount: users.length, audience };
  }

  /** Persists a notification for a user. */
  async create(
    userId: string,
    data: {
      type?: ENotificationType;
      title: string;
      body?: string;
      link?: string;
    },
  ): Promise<Notification> {
    const notification = this.repo.create({
      userId,
      type: data.type ?? ENotificationType.SYSTEM,
      title: data.title,
      body: data.body,
      link: data.link,
    });
    return this.repo.save(notification);
  }

  /** The user's notifications, newest first, optionally filtered. */
  async listForUser(
    userId: string,
    opts: { isRead?: boolean; type?: ENotificationType } = {},
  ): Promise<Notification[]> {
    const where: FindOptionsWhere<Notification> = { userId };
    if (opts.isRead !== undefined) where.isRead = opts.isRead;
    if (opts.type) where.type = opts.type;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.ownedOrThrow(userId, id);
    if (!notification.isRead) {
      notification.isRead = true;
      await this.repo.save(notification);
    }
    return notification;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  async remove(userId: string, id: string): Promise<void> {
    const notification = await this.ownedOrThrow(userId, id);
    await this.repo.remove(notification);
  }

  async removeAll(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }

  private async ownedOrThrow(
    userId: string,
    id: string,
  ): Promise<Notification> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('This notification does not belong to you.');
    }
    return notification;
  }

  // ---- legacy helpers (kept; previously no-ops, now best-effort persist) ----

  async sendNotification(userId: string, message: string) {
    try {
      await this.create(userId, {
        type: ENotificationType.SYSTEM,
        title: message,
      });
    } catch {
      /* best-effort */
    }
  }

  async notifyNewTicket(_ticket: Ticket, _creator: User) {}
  async notifyTicketStatusChanged(_ticket: Ticket, _changedBy: User) {}
  async notifyNewMessage(
    _ticket: Ticket,
    _message: Message,
    _recipient: User | User[],
  ) {}
}
