import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { applyLedgerBalanceIfManual, hideSyntheticLedgerTx } from '../accounts/ledger-balance';

const USER_ID = 'user-id';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateTransactionDto) {
    const totalInstallments = dto.totalInstallments && dto.totalInstallments > 1 ? dto.totalInstallments : 1;

    const totalAmount = typeof dto.amount === 'string' ? parseFloat(dto.amount) : dto.amount;
    const baseAmount = Math.floor((totalAmount / totalInstallments) * 100) / 100;
    const remainder = Math.round((totalAmount - baseAmount * totalInstallments) * 100) / 100;

    return this.prisma.$transaction(async (tx) => {
      let firstTransactionId = null;
      let firstTransaction = null;

      for (let i = 1; i <= totalInstallments; i++) {
        const isFirst = i === 1;
        // O primeiro mês absorve os centavos restantes para fechar a conta
        const installmentAmount = isFirst ? baseAmount + remainder : baseAmount;

        const date = new Date(dto.date);
        date.setMonth(date.getMonth() + (i - 1));

        const status: string = isFirst ? (dto.status ?? 'COMPLETED') : 'SCHEDULED';

        const data: any = {
          userId: USER_ID,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          amount: new Decimal(installmentAmount),
          date,
          description: totalInstallments > 1 ? `${dto.description} (${i}/${totalInstallments})` : dto.description,
          type: dto.type,
          status,
          installmentNumber: totalInstallments > 1 ? i : dto.installmentNumber,
          totalInstallments: totalInstallments > 1 ? totalInstallments : dto.totalInstallments,
          isRecurring: dto.isRecurring ?? false,
          recurringFrequency: dto.recurringFrequency,
          metadata: dto.metadata,
        };

        if (!isFirst && firstTransactionId) {
          data.parentTransactionId = firstTransactionId;
        }

        const transaction = await tx.transaction.create({ data });

        if (isFirst) {
          firstTransactionId = transaction.id;
          firstTransaction = transaction;
        }

        if (status === 'COMPLETED') {
          const balanceChange = dto.type === 'INCOME' ? installmentAmount : -installmentAmount;
          await applyLedgerBalanceIfManual(tx, dto.accountId, balanceChange);
        }
      }

      return firstTransaction;
    });
  }

  findAll(filters?: { type?: string; accountId?: string; categoryId?: string; from?: string; to?: string; status?: string; parentTransactionId?: string; source?: string }) {
    const where: Record<string, unknown> = { userId: USER_ID, ...hideSyntheticLedgerTx };
    if (filters?.type) where.type = filters.type;
    if (filters?.accountId) where.accountId = filters.accountId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.source) where.source = filters.source;
    if (filters?.status) where.status = filters.status;
    else where.status = { not: 'CANCELLED' };
    if (filters?.parentTransactionId) where.parentTransactionId = filters.parentTransactionId;
    if (filters?.from || filters?.to) {
      where.date = {};
      if (filters.from) (where.date as Record<string, Date>).gte = parseDayBound(filters.from, false);
      if (filters.to) (where.date as Record<string, Date>).lte = parseDayBound(filters.to, true);
    }
    return this.prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { date: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.transaction.findFirstOrThrow({
      where: { id, userId: USER_ID },
      include: { account: true, category: true, attachments: true, childTransactions: true },
    });
  }

  async update(id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findFirstOrThrow({
      where: { id, userId: USER_ID },
    });

    return this.prisma.$transaction(async (tx) => {
      if (existing.status === 'COMPLETED') {
        const revertAdjustment = existing.type === 'INCOME' ? -Number(existing.amount) : Number(existing.amount);
        await applyLedgerBalanceIfManual(tx, existing.accountId, revertAdjustment);
      }

      const data: Record<string, unknown> = { ...dto };
      if (dto.amount != null) data.amount = new Decimal(dto.amount);
      if (dto.date) data.date = new Date(dto.date);

      const updated = await tx.transaction.update({ where: { id }, data });

      if (updated.status === 'COMPLETED') {
        const applyAdjustment = updated.type === 'INCOME' ? Number(updated.amount) : -Number(updated.amount);
        await applyLedgerBalanceIfManual(tx, updated.accountId, applyAdjustment);
      }

      return updated;
    });
  }

  async pay(id: string) {
    const existing = await this.prisma.transaction.findFirstOrThrow({
      where: { id, userId: USER_ID },
    });

    if (existing.status === 'COMPLETED') {
      throw new BadRequestException('Transaction is already paid');
    }
    if (existing.source === DataSource.PLUGGY) {
      throw new BadRequestException('Lançamento do extrato não é pago pelo app.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      const applyAdjustment = updated.type === 'INCOME' ? Number(updated.amount) : -Number(updated.amount);
      await applyLedgerBalanceIfManual(tx, updated.accountId, applyAdjustment);

      return updated;
    });
  }

  async remove(id: string) {
    const tx = await this.prisma.transaction.findFirstOrThrow({
      where: { id, userId: USER_ID },
    });

    return this.prisma.$transaction(async (prismaTx) => {
      if (tx.status === 'COMPLETED') {
        const balanceRevert = tx.type === 'INCOME'
          ? -Number(tx.amount)
          : Number(tx.amount);
        await applyLedgerBalanceIfManual(prismaTx, tx.accountId, balanceRevert);
      }
      return prismaTx.transaction.delete({ where: { id } });
    });
  }
}

function parseDayBound(value: string, endOfDay: boolean): Date {
  const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (dayOnly) {
    const [year, month, day] = value.split('-').map(Number);
    return endOfDay
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  return new Date(value);
}
