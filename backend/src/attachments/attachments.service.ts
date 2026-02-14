import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findByTransaction(transactionId: string) {
    return this.prisma.attachment.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.attachment.findUniqueOrThrow({ where: { id } });
  }

  remove(id: string) {
    return this.prisma.attachment.delete({ where: { id } });
  }
}
