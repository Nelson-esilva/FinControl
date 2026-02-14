import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const USER_ID = 'user-id';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    const amount = new Decimal(dto.amount);
    const balanceChange = dto.type === TransactionType.INCOME ? dto.amount : -dto.amount;
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: USER_ID,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          amount,
          date: new Date(dto.date),
          description: dto.description,
          type: dto.type,
          status: dto.status ?? 'COMPLETED',
          installmentNumber: dto.installmentNumber,
          totalInstallments: dto.totalInstallments,
          isRecurring: dto.isRecurring ?? false,
          recurringFrequency: dto.recurringFrequency,
        },
      });
      await tx.account.update({
        where: { id: dto.accountId },
        data: { currentBalance: { increment: balanceChange } },
      });
      return transaction;
    });
  }

  findAll(filters?: { type?: TransactionType; accountId?: string; categoryId?: string; from?: string; to?: string }) {
    const where: Record<string, unknown> = { userId: USER_ID };
    if (filters?.type) where.type = filters.type;
    if (filters?.accountId) where.accountId = filters.accountId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.from || filters?.to) {
      where.date = {};
      if (filters.from) (where.date as Record<string, Date>).gte = new Date(filters.from);
      if (filters.to) (where.date as Record<string, Date>).lte = new Date(filters.to);
    }
    return this.prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { date: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.transaction.findFirstOrThrow({
      where: { id, userId: USER_ID },
      include: { account: true, category: true, attachments: true },
    });
  }

  async update(id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findFirstOrThrow({
      where: { id, userId: USER_ID },
    });
    let balanceAdjustment = 0;
    if (dto.amount !== undefined || dto.type !== undefined) {
      const oldAmount = Number(existing.amount);
      balanceAdjustment += existing.type === TransactionType.INCOME ? -oldAmount : oldAmount;
      const newAmount = dto.amount ?? oldAmount;
      const newType = dto.type ?? existing.type;
      balanceAdjustment += newType === TransactionType.INCOME ? newAmount : -newAmount;
    }
    const data: Record<string, unknown> = { ...dto };
    if (dto.amount != null) data.amount = new Decimal(dto.amount);
    if (dto.date) data.date = new Date(dto.date);

    // Use interactive transaction (callback) so conditional account update is valid
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({ where: { id }, data });
      if (balanceAdjustment !== 0) {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { currentBalance: { increment: balanceAdjustment } },
        });
      }
      return updated;
    });
  }

  remove(id: string) {
    return this.prisma.transaction.delete({ where: { id } });
  }
}
