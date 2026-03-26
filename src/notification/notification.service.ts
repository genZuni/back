import { Injectable } from '@nestjs/common';
import { Message } from 'src/entity/message.entity';
import { Ticket } from 'src/entity/ticket.entity';
import { User } from 'src/entity/user.entity';

@Injectable()
export class NotificationService {
  async sendNotification(userId: string, message: string) {
    console.log(userId, message);
  }

  async notifyNewTicket(ticket: Ticket, creator: User) {}
  async notifyTicketStatusChanged(ticket: Ticket, changedBy: User) {}
  async notifyNewMessage(
    ticket: Ticket,
    message: Message,
    recipient: User | User[],
  ) {}
}
