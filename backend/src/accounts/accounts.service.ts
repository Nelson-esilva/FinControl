import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Account, AccountType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateValuationDto } from './dto/create-valuation.dto';
import {
  addMonthsToKey,
  businessDate,
  fromCents,
  invoiceDates,
  invoiceMonthFor,
  isMonthKey,
  MonthKey,
  toCents,
  today as todayDate,
} from '../ledger/rules';

const USER_ID = 'user-id';

export interface Invoice {
  month: MonthKey; // mês de fechamento
  closingDate: string;
  dueDate: string;
  total: number;
  paid: number;
  remaining: number;
  isOpen: boolean;
}

export interface AccountSummary extends Omit<Account, 'initialBalance' | 'currentBalance' | 'creditLimit'> {
  initialBalance: number;
  currentBalance: number;
  creditLimit: number | null;
  /** Investimento: valor de mercado (última avaliação + movimentos depois dela). */
  marketValue: number | null;
  /** Investimento: marketValue − valor contábil (aportes − resgates). */
  yieldAmount: number | null;
  lastValuationAt: string | null;
  /** Cartão */
  openInvoice: Invoice | null;
  closedInvoice: Invoice | null;
  limitUsedPct: number | null;
  /** Valor que entra no patrimônio líquido. */
  netWorthValue: number;
}

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAccountDto) {
    const initial = new Prisma.Decimal((dto.initialBalance ?? 0).toFixed(2));
    return this.prisma.account.create({
      data: {
        ...dto,
        userId: USER_ID,
        initialBalance: initial,
        currentBalance: initial,
        creditLimit: dto.creditLimit != null ? new Prisma.Decimal(dto.creditLimit.toFixed(2)) : undefined,
      },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findFirst({ where: { id, userId: USER_ID } });
    if (!account) throw new NotFoundException('Conta não encontrada.');
    return account;
  }

  async update(id: string, dto: UpdateAccountDto) {
    const existing = await this.findOne(id);
    const data: Prisma.AccountUpdateInput = { ...dto };
    if (dto.initialBalance != null) {
      // Saldo de abertura alterado: desloca o saldo atual pela mesma diferença.
      const delta = toCents(dto.initialBalance) - toCents(existing.initialBalance);
      data.initialBalance = new Prisma.Decimal(dto.initialBalance.toFixed(2));
      data.currentBalance = { increment: new Prisma.Decimal(fromCents(delta).toFixed(2)) };
    }
    if (dto.creditLimit != null) data.creditLimit = new Prisma.Decimal(dto.creditLimit.toFixed(2));
    return this.prisma.account.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.account.delete({ where: { id } });
  }

  async listValuations(id: string) {
    await this.findOne(id);
    return this.prisma.accountValuation.findMany({ where: { accountId: id }, orderBy: { date: 'desc' } });
  }

  async addValuation(id: string, dto: CreateValuationDto) {
    const account = await this.findOne(id);
    if (account.type !== AccountType.INVESTMENT) {
      throw new BadRequestException('Só contas de investimento têm valor de mercado.');
    }
    return this.prisma.accountValuation.create({
      data: {
        accountId: id,
        value: new Prisma.Decimal(dto.value.toFixed(2)),
        date: dto.date ? businessDate(dto.date) : todayDate(),
      },
    });
  }

  async invoiceDetail(id: string, month: string) {
    const account = await this.findOne(id);
    if (account.type !== AccountType.CREDIT_CARD) throw new BadRequestException('Conta não é cartão.');
    if (!isMonthKey(month)) throw new BadRequestException('Mês inválido. Use YYYY-MM.');
    const [invoice] = (await this.invoices([account], [month], month)).get(account.id) ?? [];
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: USER_ID,
        status: 'COMPLETED',
        OR: [
          { accountId: id, invoiceMonth: month, type: { in: ['EXPENSE', 'INCOME'] } },
          { transferAccountId: id, invoiceMonth: month, type: 'PAYMENT' },
        ],
      },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { date: 'desc' },
    });
    return { invoice, transactions };
  }

  /** Totais de faturas por cartão e mês de fechamento. */
  async invoices(cards: Account[], months: MonthKey[], openMonthOf: MonthKey | ((a: Account) => MonthKey)) {
    const result = new Map<string, Invoice[]>();
    if (cards.length === 0 || months.length === 0) return result;
    const ids = cards.map((c) => c.id);
    const [charges, payments] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['accountId', 'invoiceMonth', 'type'],
        where: { accountId: { in: ids }, invoiceMonth: { in: months }, status: 'COMPLETED', type: { in: ['EXPENSE', 'INCOME'] } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['transferAccountId', 'invoiceMonth'],
        where: { transferAccountId: { in: ids }, invoiceMonth: { in: months }, status: 'COMPLETED', type: 'PAYMENT' },
        _sum: { amount: true },
      }),
    ]);
    for (const card of cards) {
      const open = typeof openMonthOf === 'function' ? openMonthOf(card) : openMonthOf;
      const list = months.map((month) => {
        const total = charges
          .filter((c) => c.accountId === card.id && c.invoiceMonth === month)
          .reduce((sum, c) => sum + (c.type === 'EXPENSE' ? 1 : -1) * toCents(c._sum.amount), 0);
        const paid = payments
          .filter((p) => p.transferAccountId === card.id && p.invoiceMonth === month)
          .reduce((sum, p) => sum + toCents(p._sum.amount), 0);
        const { closingDate, dueDate } = invoiceDates(month, card.closingDay, card.dueDate);
        return {
          month,
          closingDate: closingDate.toISOString(),
          dueDate: dueDate.toISOString(),
          total: fromCents(total),
          paid: fromCents(paid),
          remaining: fromCents(Math.max(0, total - paid)),
          isOpen: month >= open,
        };
      });
      result.set(card.id, list);
    }
    return result;
  }

  async summaries(clientToday?: string): Promise<AccountSummary[]> {
    const now = todayDate(clientToday);
    const accounts = await this.prisma.account.findMany({
      where: { userId: USER_ID },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      include: { valuations: { orderBy: { date: 'desc' }, take: 1 } },
    });

    const cards = accounts.filter((a) => a.type === AccountType.CREDIT_CARD);
    const openMonth = (a: Account) => invoiceMonthFor(now, a.closingDay);
    const months = Array.from(new Set(cards.flatMap((c) => [addMonthsToKey(openMonth(c), -1), openMonth(c)])));
    const invoices = await this.invoices(cards, months, openMonth);

    // Movimentos de investimento depois da última avaliação ajustam o valor de mercado.
    const investments = accounts.filter((a) => a.type === AccountType.INVESTMENT && a.valuations[0]);
    const afterValuation = new Map<string, number>();
    for (const inv of investments) {
      const since = inv.valuations[0].date;
      const rows = await this.prisma.transaction.findMany({
        where: {
          status: 'COMPLETED',
          date: { gt: since },
          OR: [{ accountId: inv.id }, { transferAccountId: inv.id }],
        },
        select: { type: true, amount: true, accountId: true, transferAccountId: true },
      });
      let delta = 0;
      for (const r of rows) {
        if (r.type === 'INCOME' && r.accountId === inv.id) delta += toCents(r.amount);
        else if (r.type === 'EXPENSE' && r.accountId === inv.id) delta -= toCents(r.amount);
        else if (r.type === 'PAYMENT') delta += r.transferAccountId === inv.id ? toCents(r.amount) : -toCents(r.amount);
      }
      afterValuation.set(inv.id, delta);
    }

    return accounts.map(({ valuations, ...a }) => {
      const balance = toCents(a.currentBalance);
      let marketValue: number | null = null;
      let yieldAmount: number | null = null;
      if (a.type === AccountType.INVESTMENT) {
        const v = valuations[0];
        const market = v ? toCents(v.value) + (afterValuation.get(a.id) ?? 0) : balance;
        marketValue = fromCents(market);
        yieldAmount = fromCents(market - balance);
      }
      let openInvoice: Invoice | null = null;
      let closedInvoice: Invoice | null = null;
      let limitUsedPct: number | null = null;
      if (a.type === AccountType.CREDIT_CARD) {
        const list = invoices.get(a.id) ?? [];
        closedInvoice = list.find((i) => !i.isOpen && i.remaining > 0) ?? null;
        openInvoice = list.find((i) => i.isOpen) ?? null;
        const limit = toCents(a.creditLimit);
        limitUsedPct = limit > 0 ? Math.min(100, Math.round((Math.max(0, -balance) / limit) * 100)) : null;
      }
      return {
        ...a,
        initialBalance: fromCents(toCents(a.initialBalance)),
        currentBalance: fromCents(balance),
        creditLimit: a.creditLimit != null ? fromCents(toCents(a.creditLimit)) : null,
        marketValue,
        yieldAmount,
        lastValuationAt: valuations[0]?.date.toISOString() ?? null,
        openInvoice,
        closedInvoice,
        limitUsedPct,
        netWorthValue: a.isActive ? (marketValue ?? fromCents(balance)) : 0,
      };
    });
  }
}
