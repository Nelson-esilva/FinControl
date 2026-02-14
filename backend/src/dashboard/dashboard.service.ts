import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

const USER_ID = 'user-id';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getData() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [accounts, transactions, recentTransactions] = await Promise.all([
      this.prisma.account.findMany({
        where: { userId: USER_ID, isActive: true },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId: USER_ID,
          date: { gte: startOfMonth, lte: endOfMonth },
          status: 'COMPLETED',
        },
        include: { category: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId: USER_ID },
        include: { account: true, category: true },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    const totalBalance = accounts.reduce(
      (sum, a) => sum + Number(a.currentBalance),
      0,
    );
    const monthlyIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpense = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryMap = new Map<string, { name: string; value: number; color: string }>();
    transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .forEach((t) => {
        const key = t.categoryId;
        const cur = categoryMap.get(key) ?? {
          name: t.category.name,
          value: 0,
          color: t.category.color ?? '#6366f1',
        };
        cur.value += Number(t.amount);
        categoryMap.set(key, cur);
      });
    const categorySummary = Array.from(categoryMap.values());

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        description: t.description,
        category: t.category.name,
        categoryColor: t.category.color,
        account: t.account.name,
        date: t.date,
        amount: Number(t.amount) * (t.type === TransactionType.INCOME ? 1 : -1),
        type: t.type.toLowerCase(),
      })),
      categorySummary,
    };
  }
}
