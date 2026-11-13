import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountType, DataSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { RecurringExpensesService } from '../recurring-expenses/recurring-expenses.service';
import { TRANSACTION_INCLUDE } from '../transactions/transactions.service';
import {
  addMonthsToKey,
  balanceEffects,
  businessDate,
  daysInMonth,
  fromCents,
  isMonthKey,
  merchantKey,
  monthDiff,
  monthKey,
  monthRange,
  occurrenceInMonth,
  toCents,
  today as todayDate,
} from '../ledger/rules';

const USER_ID = 'user-id';

export const SPENDING_GROUPS = ['category', 'account', 'nature', 'weekday', 'tag', 'merchant', 'phase'] as const;
export type SpendingGroupBy = (typeof SPENDING_GROUPS)[number];

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const NATURE_LABELS: Record<string, { label: string; color: string }> = {
  ESSENTIAL: { label: 'Essencial', color: '#5CC8FF' },
  IMPORTANT: { label: 'Importante', color: '#8B8CFF' },
  SUPERFLUOUS: { label: 'Supérfluo', color: '#FF9F6B' },
  NONE: { label: 'Sem classificação', color: '#6B7280' },
};

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_LABELS[m - 1]}/${String(y).slice(2)}`;
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
    private readonly recurring: RecurringExpensesService,
  ) {}

  private async sumByType(type: 'INCOME' | 'EXPENSE', start: Date, end: Date) {
    const agg = await this.prisma.transaction.aggregate({
      where: { userId: USER_ID, type, status: 'COMPLETED', date: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    return toCents(agg._sum.amount);
  }

  async netWorthNow(clientToday?: string) {
    const [accounts, recurring] = await Promise.all([
      this.accounts.summaries(clientToday),
      this.recurring.findAll(undefined, 'ACTIVE', clientToday),
    ]);
    let cash = 0;
    let investments = 0;
    let cards = 0;
    for (const a of accounts) {
      if (!a.isActive) continue;
      const v = toCents(a.netWorthValue);
      if (a.type === AccountType.INVESTMENT) investments += v;
      else if (a.type === AccountType.CREDIT_CARD) cards += v;
      else cash += v;
    }
    const loans = recurring
      .filter((r) => (r.type === 'LOAN' || r.type === 'INSTALLMENT') && r.outstanding != null)
      .reduce((s, r) => s + toCents(r.outstanding), 0);
    return {
      cash: fromCents(cash),
      investments: fromCents(investments),
      cards: fromCents(cards),
      loans: fromCents(-loans),
      total: fromCents(cash + investments + cards - loans),
    };
  }

  async overview(month?: string, clientToday?: string) {
    const now = todayDate(clientToday);
    const current = monthKey(now);
    const key = month ?? current;
    if (!isMonthKey(key)) throw new BadRequestException('Mês inválido. Use YYYY-MM.');
    const { start, end } = monthRange(key);

    const [bills, incomeReceived, spent, netWorth, recent, byCategory] = await Promise.all([
      this.recurring.getBills(key, clientToday),
      this.sumByType('INCOME', start, end),
      this.sumByType('EXPENSE', start, end),
      this.netWorthNow(clientToday),
      this.prisma.transaction.findMany({
        where: { userId: USER_ID, status: { not: 'CANCELLED' }, date: { lte: new Date(now.getTime() + 86_400_000) } },
        include: TRANSACTION_INCLUDE,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 6,
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId: USER_ID, type: 'EXPENSE', status: 'COMPLETED', date: { gte: start, lt: end } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    // Média de gasto dos 3 meses anteriores.
    let prevTotal = 0;
    for (let i = 1; i <= 3; i++) {
      const r = monthRange(addMonthsToKey(key, -i));
      prevTotal += await this.sumByType('EXPENSE', r.start, r.end);
    }
    const avg3 = Math.round(prevTotal / 3);

    let pendingIncome = 0;
    let pendingOut = 0;
    for (const b of bills.items) {
      if (b.isPaid) continue;
      const remaining = Math.max(0, toCents(b.amount) - toCents(b.paidAmount));
      if (b.direction === 'IN') pendingIncome += remaining;
      // Fatura de cartão não entra: as compras já contam como gasto.
      else if (b.kind !== 'CARD_INVOICE') pendingOut += remaining;
    }
    const expectedIncome = incomeReceived + pendingIncome;
    const free = expectedIncome - spent - pendingOut;
    const totalDays = daysInMonth(key);
    const daysLeft = key === current ? totalDays - now.getUTCDate() + 1 : key > current ? totalDays : 0;

    // Próximos 7 dias (podem cruzar o mês).
    const horizon = new Date(now.getTime() + 7 * 86_400_000);
    const nextMonthBills =
      monthKey(horizon) !== current ? (await this.recurring.getBills(monthKey(horizon), clientToday)).items : [];
    const currentBills = key === current ? bills.items : (await this.recurring.getBills(current, clientToday)).items;
    const upcoming = [...currentBills, ...nextMonthBills]
      .filter((b) => !b.isPaid && new Date(b.dueDate) >= new Date(now.getTime() - 12 * 3_600_000) && new Date(b.dueDate) <= horizon)
      .slice(0, 8);
    const overdue = currentBills.filter((b) => b.isOverdue);

    const categoryIds = byCategory.map((c) => c.categoryId).filter((id): id is string => !!id);
    const categories = await this.prisma.category.findMany({ where: { id: { in: categoryIds } } });
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const topCategories = byCategory.slice(0, 6).map((row) => {
      const cat = row.categoryId ? catMap.get(row.categoryId) : null;
      const amount = toCents(row._sum.amount);
      return {
        id: row.categoryId,
        name: cat?.name ?? 'Sem categoria',
        color: cat?.color ?? '#6B7280',
        amount: fromCents(amount),
        pct: spent > 0 ? Math.round((amount / spent) * 100) : 0,
      };
    });

    return {
      month: key,
      daysLeft,
      freeToSpend: fromCents(free),
      perDay: daysLeft > 0 ? fromCents(Math.max(0, Math.floor(free / daysLeft))) : null,
      expectedIncome: fromCents(expectedIncome),
      incomeReceived: fromCents(incomeReceived),
      pendingIncome: fromCents(pendingIncome),
      spent: fromCents(spent),
      pendingCommitments: fromCents(pendingOut),
      commitmentsTotal: bills.totals.out,
      avgSpent3m: fromCents(avg3),
      spentVsAvgPct: avg3 > 0 ? Math.round(((spent - avg3) / avg3) * 100) : null,
      netWorth,
      upcoming,
      overdue,
      topCategories,
      recent,
    };
  }

  async cashflow(months: number, clientToday?: string) {
    const current = monthKey(todayDate(clientToday));
    const first = addMonthsToKey(current, -(months - 1));
    const rows = await this.prisma.transaction.findMany({
      where: {
        userId: USER_ID,
        status: 'COMPLETED',
        type: { in: ['INCOME', 'EXPENSE'] },
        date: { gte: monthRange(first).start, lt: monthRange(current).end },
      },
      select: { type: true, amount: true, date: true },
    });
    const series = Array.from({ length: months }, (_, i) => {
      const key = addMonthsToKey(first, i);
      return { month: key, label: monthLabel(key), income: 0, expense: 0, net: 0 };
    });
    for (const r of rows) {
      const idx = monthDiff(first, monthKey(r.date));
      const slot = series[idx];
      if (!slot) continue;
      if (r.type === 'INCOME') slot.income += toCents(r.amount);
      else slot.expense += toCents(r.amount);
    }
    return series.map((s) => ({
      ...s,
      income: fromCents(s.income),
      expense: fromCents(s.expense),
      net: fromCents(s.income - s.expense),
    }));
  }

  /**
   * Patrimônio no fim de cada mês: saldo atual menos efeitos posteriores (contas manuais),
   * mais o ajuste da avaliação de investimento vigente, menos dívidas parceladas restantes.
   */
  async netWorthSeries(months: number, clientToday?: string) {
    const now = todayDate(clientToday);
    const current = monthKey(now);
    const first = addMonthsToKey(current, -(months - 1));
    const firstEnd = monthRange(first).end;

    const [accounts, recurring, now$] = await Promise.all([
      this.prisma.account.findMany({
        where: { userId: USER_ID, isActive: true },
        include: { valuations: { orderBy: { date: 'asc' } } },
      }),
      this.prisma.recurringExpense.findMany({
        where: { userId: USER_ID, type: { in: ['LOAN', 'INSTALLMENT'] }, totalInstallments: { not: null } },
      }),
      this.netWorthNow(clientToday),
    ]);
    const manualIds = new Set(accounts.filter((a) => a.source === DataSource.MANUAL).map((a) => a.id));
    const txs = await this.prisma.transaction.findMany({
      where: {
        userId: USER_ID,
        status: 'COMPLETED',
        date: { gte: firstEnd },
        OR: [{ accountId: { in: [...manualIds] } }, { transferAccountId: { in: [...manualIds] } }],
      },
      select: { type: true, amount: true, accountId: true, transferAccountId: true, date: true },
    });
    const effects = txs.flatMap((t) =>
      balanceEffects({ type: t.type, amountCents: toCents(t.amount), accountId: t.accountId, transferAccountId: t.transferAccountId })
        .filter((e) => manualIds.has(e.accountId))
        .map((e) => ({ ...e, time: t.date.getTime() })),
    );
    const balanceAt = (accountId: string, current: number, time: number) =>
      current - effects.filter((e) => e.accountId === accountId && e.time >= time).reduce((s, e) => s + e.delta, 0);

    const series = [];
    for (let i = 0; i < months; i++) {
      const key = addMonthsToKey(first, i);
      if (key === current) {
        series.push({ month: key, label: monthLabel(key), value: now$.total });
        continue;
      }
      const endTime = monthRange(key).end.getTime();
      let total = 0;
      for (const a of accounts) {
        const cur = toCents(a.currentBalance);
        let value = manualIds.has(a.id) ? balanceAt(a.id, cur, endTime) : cur;
        if (a.type === AccountType.INVESTMENT) {
          const v = [...a.valuations].reverse().find((x) => x.date.getTime() < endTime);
          if (v) value += toCents(v.value) - balanceAt(a.id, cur, v.date.getTime() + 1);
        }
        total += value;
      }
      for (const r of recurring) {
        const occ = occurrenceInMonth(r, key);
        const total$ = r.totalInstallments ?? 0;
        let remaining = 0;
        if (occ?.installmentNumber) remaining = total$ - occ.installmentNumber;
        else if (key < monthKey(r.startDate)) remaining = total$ - r.firstInstallment + 1;
        total -= Math.max(0, remaining) * toCents(r.amount);
      }
      series.push({ month: key, label: monthLabel(key), value: fromCents(total) });
    }
    return { current: now$, series };
  }

  async spending(from: string, to: string, groupBy: SpendingGroupBy, compare: boolean) {
    const start = businessDate(from);
    const end = businessDate(to);
    if (end < start) throw new BadRequestException('Período inválido.');
    const result = await this.group(start, end, groupBy);
    if (!compare) return result;
    const span = end.getTime() - start.getTime() + 86_400_000;
    const prev = await this.group(new Date(start.getTime() - span), new Date(start.getTime() - 86_400_000), groupBy);
    const prevMap = new Map(prev.groups.map((g) => [g.key, g.amount]));
    return {
      ...result,
      previousTotal: prev.total,
      groups: result.groups.map((g) => ({ ...g, previousAmount: prevMap.get(g.key) ?? 0 })),
    };
  }

  private async group(start: Date, end: Date, groupBy: SpendingGroupBy) {
    const rows = await this.prisma.transaction.findMany({
      where: {
        userId: USER_ID,
        type: 'EXPENSE',
        status: 'COMPLETED',
        date: { gte: new Date(start.getTime() - 12 * 3_600_000), lte: new Date(end.getTime() + 12 * 3_600_000) },
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        account: { select: { id: true, name: true, color: true } },
      },
    });

    const groups = new Map<string, { key: string; label: string; color: string; amount: number; count: number; order: number }>();
    const add = (key: string, label: string, color: string, cents: number, order = 0) => {
      const g = groups.get(key) ?? { key, label, color, amount: 0, count: 0, order };
      g.amount += cents;
      g.count += 1;
      groups.set(key, g);
    };

    for (const t of rows) {
      const cents = toCents(t.amount);
      switch (groupBy) {
        case 'category':
          add(t.category?.id ?? 'none', t.category?.name ?? 'Sem categoria', t.category?.color ?? '#6B7280', cents);
          break;
        case 'account':
          add(t.account.id, t.account.name, t.account.color, cents);
          break;
        case 'nature': {
          const n = NATURE_LABELS[t.nature ?? 'NONE'];
          add(t.nature ?? 'NONE', n.label, n.color, cents);
          break;
        }
        case 'weekday': {
          const d = t.date.getUTCDay();
          add(String(d), WEEKDAYS[d], '#8B8CFF', cents, d === 0 ? 7 : d);
          break;
        }
        case 'tag':
          for (const tag of t.tags) add(tag, `#${tag}`, '#A9AAFF', cents);
          break;
        case 'merchant': {
          const k = merchantKey(t.description);
          add(k, t.description.replace(/\s*\(\d+\/\d+\)\s*$/, ''), t.category?.color ?? '#8B8CFF', cents);
          break;
        }
        case 'phase': {
          const day = t.date.getUTCDate();
          const idx = day <= 10 ? 0 : day <= 20 ? 1 : 2;
          add(String(idx), ['Dias 1 a 10', 'Dias 11 a 20', 'Dias 21 a 31'][idx], '#8B8CFF', cents, idx);
          break;
        }
      }
    }

    // Dia da semana: média por ocorrência daquele dia no período.
    if (groupBy === 'weekday') {
      for (let d = 0; d < 7; d++) {
        if (!groups.has(String(d))) groups.set(String(d), { key: String(d), label: WEEKDAYS[d], color: '#8B8CFF', amount: 0, count: 0, order: d === 0 ? 7 : d });
      }
      const counts = Array(7).fill(0);
      for (let t = start.getTime(); t <= end.getTime(); t += 86_400_000) counts[new Date(t).getUTCDay()] += 1;
      for (const g of groups.values()) g.amount = Math.round(g.amount / Math.max(1, counts[Number(g.key)]));
    }

    const total = rows.reduce((s, t) => s + toCents(t.amount), 0);
    const ordered = [...groups.values()].sort((a, b) =>
      groupBy === 'weekday' || groupBy === 'phase' ? a.order - b.order : b.amount - a.amount,
    );
    const monthsInRange = monthDiff(monthKey(start), monthKey(end)) + 1;
    return {
      from: start.toISOString(),
      to: end.toISOString(),
      groupBy,
      total: fromCents(total),
      count: rows.length,
      months: monthsInRange,
      groups: ordered.map(({ order: _o, ...g }) => ({
        ...g,
        amount: fromCents(g.amount),
        pct: total > 0 && groupBy !== 'weekday' ? Math.round((g.amount / total) * 100) : null,
      })),
    };
  }
}
