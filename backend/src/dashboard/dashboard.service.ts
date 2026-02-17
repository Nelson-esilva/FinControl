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

    // Últimos 12 meses: receita, despesa e saldo por mês
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const last12MonthsTxs = await this.prisma.transaction.findMany({
      where: { userId: USER_ID, date: { gte: twelveMonthsAgo }, status: 'COMPLETED' },
    });
    const byMonth = new Map<string, { income: number; expense: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth.set(key, { income: 0, expense: 0 });
    }
    last12MonthsTxs.forEach((t) => {
      const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
      const cur = byMonth.get(key);
      if (cur) {
        if (t.type === TransactionType.INCOME) cur.income += Number(t.amount);
        else cur.expense += Number(t.amount);
      }
    });
    const monthlySummary = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v], idx) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + idx, 1);
        return {
          month: monthNames[d.getMonth()],
          income: v.income,
          expense: v.expense,
          balance: v.income - v.expense,
        };
      });

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense,
      monthlySummary,
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
