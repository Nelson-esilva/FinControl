import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-id';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(unreadOnly?: boolean) {
    return this.prisma.notification.findMany({
      where: { userId: USER_ID, ...(unreadOnly && { isRead: false }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.notification.findFirstOrThrow({
      where: { id, userId: USER_ID },
    });
  }

  markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  markAllAsRead() {
    return this.prisma.notification.updateMany({
      where: { userId: USER_ID },
      data: { isRead: true },
    });
  }
}
