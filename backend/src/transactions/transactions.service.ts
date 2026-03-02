import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Decimal } from '@prisma/client/runtime/library';

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
          await tx.account.update({
            where: { id: dto.accountId },
            data: { currentBalance: { increment: balanceChange } },
          });
        }
      }

      if (dto.type === 'PAYMENT' && dto.metadata?.isCreditCardPayment && firstTransactionId) {
        const dateObj = new Date(dto.date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();

        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const creditCardBills = await tx.recurringExpense.findMany({
          where: { userId: USER_ID, type: 'CREDIT_CARD' }
        });

        for (const bill of creditCardBills) {
          const existingTx = await tx.transaction.findFirst({
            where: {
              userId: USER_ID,
              recurringExpenseId: bill.id,
              date: { gte: startOfMonth, lte: endOfMonth }
            }
          });

          if (!existingTx) {
            let dueDay = bill.dueDay || startOfMonth.getDate();
            if (dueDay > endOfMonth.getDate()) dueDay = endOfMonth.getDate();
            const txDate = new Date(year, month, dueDay);

            let catId = bill.categoryId;
            if (!catId) {
              const fallbackCat = await tx.category.findFirst({
                where: { userId: USER_ID, type: "EXPENSE" }
              });
              catId = fallbackCat?.id || dto.categoryId;
            }

            await tx.transaction.create({
              data: {
                userId: USER_ID,
                accountId: dto.accountId,
                categoryId: catId,
                amount: bill.amount,
                date: txDate,
                description: `Pagamento: ${bill.name}`,
                type: 'EXPENSE',
                status: 'COMPLETED',
                isRecurring: true,
                recurringExpenseId: bill.id,
                metadata: { isHidden: true, parentPaymentId: firstTransactionId }
              }
            });
          }
        }
      }

      return firstTransaction;
    });
  }

  findAll(filters?: { type?: string; accountId?: string; categoryId?: string; from?: string; to?: string; status?: string; parentTransactionId?: string }) {
    const where: Record<string, unknown> = { userId: USER_ID };
    if (filters?.type) where.type = filters.type;
    if (filters?.accountId) where.accountId = filters.accountId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.status) where.status = filters.status;
    if (filters?.parentTransactionId) where.parentTransactionId = filters.parentTransactionId;
    if (filters?.from || filters?.to) {
      where.date = {};
      if (filters.from) (where.date as Record<string, Date>).gte = new Date(filters.from);
      if (filters.to) (where.date as Record<string, Date>).lte = new Date(filters.to);
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
      // Se estava concluída, reverte o saldo antes de atualizar
      if (existing.status === 'COMPLETED') {
        const revertAdjustment = existing.type === 'INCOME' ? -Number(existing.amount) : Number(existing.amount);
        await tx.account.update({
          where: { id: existing.accountId },
          data: { currentBalance: { increment: revertAdjustment } },
        });
      }

      const data: Record<string, unknown> = { ...dto };
      if (dto.amount != null) data.amount = new Decimal(dto.amount);
      if (dto.date) data.date = new Date(dto.date);

      const updated = await tx.transaction.update({ where: { id }, data });

      // Se a nova transação ou situação ficou como concluída, aplica o saldo
      if (updated.status === 'COMPLETED') {
        const applyAdjustment = updated.type === 'INCOME' ? Number(updated.amount) : -Number(updated.amount);
        await tx.account.update({
          where: { id: updated.accountId },
          data: { currentBalance: { increment: applyAdjustment } },
        });
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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      const applyAdjustment = updated.type === 'INCOME' ? Number(updated.amount) : -Number(updated.amount);
      await tx.account.update({
        where: { id: updated.accountId },
        data: { currentBalance: { increment: applyAdjustment } },
      });

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
        await prismaTx.account.update({
          where: { id: tx.accountId },
          data: { currentBalance: { increment: balanceRevert } },
        });
      }
      return prismaTx.transaction.delete({ where: { id } });
    });
  }
}
