import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountType, DataSource, Prisma, RecurringExpense, SpendingNature } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { applyTransactionEffects } from '../accounts/ledger-balance';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { PayBillDto } from './dto/link-bill.dto';
import {
  addMonthsToKey,
  businessDate,
  fromCents,
  invoiceMonthFor,
  isMonthKey,
  MonthKey,
  monthKey,
  monthlyEquivalentCents,
  monthRange,
  occurrenceInMonth,
  remainingInstallments,
  toCents,
  today as todayDate,
} from '../ledger/rules';

const USER_ID = 'user-id';

export type BillGroup = 'FIXED' | 'SUBSCRIPTION' | 'INSTALLMENT' | 'LOAN' | 'INCOME' | 'CARD';

export interface Bill {
  id: string;
  kind: 'RECURRING' | 'SCHEDULED' | 'CARD_INVOICE';
  refId: string;
  name: string;
  group: BillGroup;
  direction: 'IN' | 'OUT';
  amount: number;
  dueDate: string;
  isPaid: boolean;
  isOverdue: boolean;
  paidAmount: number;
  transactionId: string | null;
  paidVia: 'MANUAL' | 'EXTRACT' | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  /** Cobrado no cartão: já entra na fatura, não soma de novo no total do mês. */
  viaCard: boolean;
  account: { id: string; name: string; type: AccountType } | null;
  category: { id: string; name: string; color: string } | null;
  color: string;
  invoiceMonth: string | null;
}

const DEFAULT_NATURE: Partial<Record<string, SpendingNature>> = {
  FIXED: 'ESSENTIAL',
  LOAN: 'ESSENTIAL',
  INSTALLMENT: 'IMPORTANT',
  SUBSCRIPTION: 'IMPORTANT',
};

const INCLUDE = {
  category: { select: { id: true, name: true, color: true } },
  account: { select: { id: true, name: true, type: true } },
} satisfies Prisma.RecurringExpenseInclude;

@Injectable()
export class RecurringExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
  ) {}

  private toData(dto: Partial<CreateRecurringExpenseDto>) {
    const data: Prisma.RecurringExpenseUncheckedUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount.toFixed(2));
    if (dto.frequency !== undefined) data.frequency = dto.frequency;
    if (dto.dueDay !== undefined) data.dueDay = dto.dueDay;
    if (dto.startDate !== undefined) data.startDate = businessDate(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? businessDate(dto.endDate) : null;
    if (dto.firstInstallment !== undefined) data.firstInstallment = dto.firstInstallment;
    if (dto.totalInstallments !== undefined) data.totalInstallments = dto.totalInstallments;
    if (dto.interestRate !== undefined) {
      data.interestRate = dto.interestRate != null ? new Prisma.Decimal(dto.interestRate.toFixed(2)) : null;
    }
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId || null;
    if (dto.accountId !== undefined) data.accountId = dto.accountId || null;
    return data;
  }

  private async assertRefs(dto: Partial<CreateRecurringExpenseDto>) {
    if (dto.accountId) await this.accounts.findOne(dto.accountId);
    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({ where: { id: dto.categoryId, userId: USER_ID } });
      if (!cat) throw new NotFoundException('Categoria não encontrada.');
    }
  }

  async create(dto: CreateRecurringExpenseDto) {
    await this.assertRefs(dto);
    const data = this.toData(dto) as unknown as Prisma.RecurringExpenseUncheckedCreateInput;
    return this.prisma.recurringExpense.create({
      data: { ...data, userId: USER_ID, frequency: dto.frequency ?? 'MONTHLY' },
      include: INCLUDE,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.recurringExpense.findFirst({ where: { id, userId: USER_ID }, include: INCLUDE });
    if (!row) throw new NotFoundException('Compromisso não encontrado.');
    return row;
  }

  async update(id: string, dto: UpdateRecurringExpenseDto) {
    await this.findOne(id);
    await this.assertRefs(dto);
    const data = this.toData(dto);
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.recurringExpense.update({ where: { id }, data, include: INCLUDE });
  }

  /** Lançamentos já registrados continuam no extrato; só perdem o vínculo. */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.recurringExpense.delete({ where: { id } });
  }

  async findAll(type?: string, status?: string, clientToday?: string) {
    const where: Prisma.RecurringExpenseWhereInput = { userId: USER_ID };
    if (type) where.type = type as RecurringExpense['type'];
    if (status) where.status = status as RecurringExpense['status'];
    const rows = await this.prisma.recurringExpense.findMany({
      where,
      include: { ...INCLUDE, transactions: { where: { status: 'COMPLETED' }, select: { occurrenceMonth: true } } },
      orderBy: [{ status: 'asc' }, { dueDay: 'asc' }, { name: 'asc' }],
    });
    const current = monthKey(todayDate(clientToday));
    return rows.map(({ transactions, ...r }) => {
      const paidMonths = new Set(transactions.map((t) => t.occurrenceMonth));
      const paidCount = paidMonths.size;
      const remaining = remainingInstallments(r, paidCount);
      let next: { month: MonthKey; dueDate: string; installmentNumber: number | null } | null = null;
      if (r.status === 'ACTIVE') {
        for (let i = 0; i < 24 && !next; i++) {
          const month = addMonthsToKey(current, i);
          const occ = occurrenceInMonth(r, month);
          if (occ && !paidMonths.has(month)) {
            next = { month, dueDate: occ.dueDate.toISOString(), installmentNumber: occ.installmentNumber };
          }
        }
      }
      return {
        ...r,
        amount: Number(r.amount),
        interestRate: r.interestRate != null ? Number(r.interestRate) : null,
        monthlyAmount: fromCents(monthlyEquivalentCents(toCents(r.amount), r.frequency)),
        paidCount,
        remainingInstallments: remaining,
        outstanding: remaining != null ? fromCents(remaining * toCents(r.amount)) : null,
        next,
      };
    });
  }

  /** Totais mensais normalizados (semanal × 52/12, anual ÷ 12). */
  async getSummary() {
    const rows = await this.findAll(undefined, 'ACTIVE');
    const byType: Record<string, number> = { FIXED: 0, SUBSCRIPTION: 0, INSTALLMENT: 0, LOAN: 0, INCOME: 0 };
    let debt = 0;
    for (const r of rows) {
      byType[r.type] += toCents(r.monthlyAmount);
      if ((r.type === 'LOAN' || r.type === 'INSTALLMENT') && r.outstanding != null) debt += toCents(r.outstanding);
    }
    const monthlyOut = byType.FIXED + byType.SUBSCRIPTION + byType.INSTALLMENT + byType.LOAN;
    return {
      monthlyOut: fromCents(monthlyOut),
      monthlyIn: fromCents(byType.INCOME),
      byType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, fromCents(v)])),
      debtOutstanding: fromCents(debt),
      count: rows.length,
    };
  }

  async getBills(month: string, clientToday?: string) {
    if (!isMonthKey(month)) throw new BadRequestException('Mês inválido. Use YYYY-MM.');
    const now = todayDate(clientToday);
    const { start, end } = monthRange(month);
    const bills: Bill[] = [];

    // 1. Compromissos recorrentes
    const recurring = await this.prisma.recurringExpense.findMany({
      where: { userId: USER_ID, status: { in: ['ACTIVE', 'COMPLETED'] } },
      include: {
        ...INCLUDE,
        transactions: { where: { occurrenceMonth: month, status: { not: 'CANCELLED' } } },
      },
    });
    for (const r of recurring) {
      const occ = occurrenceInMonth(r, month);
      if (!occ) continue;
      const tx = r.transactions[0] ?? null;
      if (r.status === 'COMPLETED' && !tx) continue;
      const isPaid = !!tx && tx.status === 'COMPLETED';
      bills.push({
        id: `rec-${r.id}-${month}`,
        kind: 'RECURRING',
        refId: r.id,
        name: r.name,
        group: r.type,
        direction: r.type === 'INCOME' ? 'IN' : 'OUT',
        amount: fromCents(toCents(r.amount) * occ.multiplier),
        dueDate: occ.dueDate.toISOString(),
        isPaid,
        isOverdue: !isPaid && occ.dueDate < now,
        paidAmount: tx ? Number(tx.amount) : 0,
        transactionId: tx?.id ?? null,
        paidVia: tx ? (tx.source === DataSource.PLUGGY ? 'EXTRACT' : 'MANUAL') : null,
        installmentNumber: occ.installmentNumber,
        totalInstallments: r.totalInstallments,
        viaCard: r.account?.type === AccountType.CREDIT_CARD && r.type !== 'INCOME',
        account: r.account,
        category: r.category,
        color: r.category?.color ?? r.color,
        invoiceMonth: null,
      });
    }

    // 2. Parcelas de compras fora do cartão (carnê, boleto parcelado)
    const scheduled = await this.prisma.transaction.findMany({
      where: {
        userId: USER_ID,
        type: 'EXPENSE',
        status: { in: ['SCHEDULED', 'PENDING', 'COMPLETED'] },
        installmentNumber: { gt: 1 },
        date: { gte: start, lt: end },
        account: { type: { not: AccountType.CREDIT_CARD } },
      },
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });
    for (const t of scheduled) {
      const isPaid = t.status === 'COMPLETED';
      bills.push({
        id: `tx-${t.id}`,
        kind: 'SCHEDULED',
        refId: t.id,
        name: t.description,
        group: 'INSTALLMENT',
        direction: 'OUT',
        amount: Number(t.amount),
        dueDate: t.date.toISOString(),
        isPaid,
        isOverdue: !isPaid && t.date < now,
        paidAmount: isPaid ? Number(t.amount) : 0,
        transactionId: t.id,
        paidVia: isPaid ? 'MANUAL' : null,
        installmentNumber: t.installmentNumber,
        totalInstallments: t.totalInstallments,
        viaCard: false,
        account: t.account,
        category: t.category,
        color: t.category?.color ?? '#F7C948',
        invoiceMonth: null,
      });
    }

    // 3. Faturas de cartão que vencem no mês
    const cards = await this.prisma.account.findMany({
      where: { userId: USER_ID, type: AccountType.CREDIT_CARD, isActive: true },
    });
    const invoices = await this.accounts.invoices(
      cards,
      [addMonthsToKey(month, -1), month],
      (c) => invoiceMonthFor(now, c.closingDay),
    );
    for (const card of cards) {
      for (const inv of invoices.get(card.id) ?? []) {
        if (monthKey(new Date(inv.dueDate)) !== month || inv.total <= 0) continue;
        const isPaid = inv.remaining <= 0;
        bills.push({
          id: `card-${card.id}-${inv.month}`,
          kind: 'CARD_INVOICE',
          refId: card.id,
          name: `Fatura ${card.name}`,
          group: 'CARD',
          direction: 'OUT',
          amount: inv.total,
          dueDate: inv.dueDate,
          isPaid,
          isOverdue: !isPaid && new Date(inv.dueDate) < now,
          paidAmount: inv.paid,
          transactionId: null,
          paidVia: isPaid ? 'MANUAL' : null,
          installmentNumber: null,
          totalInstallments: null,
          viaCard: false,
          account: { id: card.id, name: card.name, type: card.type },
          category: null,
          color: card.color,
          invoiceMonth: inv.month,
        });
      }
    }

    bills.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name));

    let out = 0;
    let outPaid = 0;
    let inn = 0;
    let inReceived = 0;
    for (const b of bills) {
      if (b.viaCard) continue;
      const cents = toCents(b.amount);
      if (b.direction === 'IN') {
        inn += cents;
        if (b.isPaid) inReceived += cents;
      } else {
        out += cents;
        outPaid += b.isPaid ? cents : Math.min(cents, toCents(b.paidAmount));
      }
    }
    return {
      month,
      items: bills,
      totals: {
        out: fromCents(out),
        outPaid: fromCents(outPaid),
        outOpen: fromCents(out - outPaid),
        in: fromCents(inn),
        inReceived: fromCents(inReceived),
        inOpen: fromCents(inn - inReceived),
        overdueCount: bills.filter((b) => b.isOverdue).length,
      },
    };
  }

  /** Linhas do extrato (Pluggy) parecidas com o compromisso, para vincular em vez de duplicar. */
  async findCandidates(id: string, month: string) {
    const r = await this.findOne(id);
    if (!isMonthKey(month)) throw new BadRequestException('Informe o mês (YYYY-MM).');
    const occ = occurrenceInMonth(r, month);
    if (!occ) return [];
    const amount = toCents(r.amount) * occ.multiplier;
    const windowStart = new Date(occ.dueDate.getTime() - 10 * 86_400_000);
    const windowEnd = new Date(occ.dueDate.getTime() + 10 * 86_400_000);
    const txs = await this.prisma.transaction.findMany({
      where: {
        userId: USER_ID,
        source: DataSource.PLUGGY,
        status: { not: 'CANCELLED' },
        type: r.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
        recurringExpenseId: null,
        date: { gte: windowStart, lte: windowEnd },
      },
      include: { account: { select: { name: true } } },
    });
    const tokens = tokenize(r.name);
    const tolerance = Math.max(100, Math.round(amount * 0.02));
    return txs
      .map((row) => {
        const diff = Math.abs(toCents(row.amount) - amount);
        if (diff > tolerance) return null;
        const days = Math.abs((row.date.getTime() - occ.dueDate.getTime()) / 86_400_000);
        const nameHit = tokens.some((t) => row.description.toLowerCase().includes(t));
        return {
          id: row.id,
          date: row.date,
          description: row.description,
          amount: Number(row.amount),
          accountName: row.account.name,
          score: (diff === 0 ? 50 : 40) + (nameHit ? 30 : 0) + Math.max(0, 20 - days),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ score: _score, ...rest }) => rest);
  }

  /** Pagar (ou receber) a ocorrência do mês: cria um lançamento real que move o saldo. */
  async payBill(id: string, dto: PayBillDto) {
    const r = await this.findOne(id);
    const occ = occurrenceInMonth(r, dto.month);
    if (!occ) throw new BadRequestException('Este compromisso não vence neste mês.');

    const already = await this.prisma.transaction.findFirst({
      where: { recurringExpenseId: id, occurrenceMonth: dto.month, status: { not: 'CANCELLED' } },
    });
    if (already) throw new BadRequestException('Este compromisso já está marcado como pago neste mês.');
    // Linha anulada do extrato ainda segura a chave única (compromisso, mês): solta o vínculo.
    await this.prisma.transaction.updateMany({
      where: { recurringExpenseId: id, occurrenceMonth: dto.month, status: 'CANCELLED' },
      data: { recurringExpenseId: null, occurrenceMonth: null },
    });

    if (dto.transactionId) {
      const extract = await this.prisma.transaction.findFirst({ where: { id: dto.transactionId, userId: USER_ID } });
      if (!extract) throw new NotFoundException('Lançamento não encontrado.');
      if (extract.recurringExpenseId) throw new BadRequestException('Este lançamento já está ligado a outro compromisso.');
      const linked = await this.prisma.transaction.update({
        where: { id: extract.id },
        data: {
          recurringExpenseId: id,
          occurrenceMonth: dto.month,
          ...(r.categoryId && !extract.categoryId ? { categoryId: r.categoryId } : {}),
        },
      });
      await this.completeIfFinished(r.id);
      return linked;
    }

    const accountId = dto.accountId ?? r.accountId;
    if (!accountId) throw new BadRequestException('Escolha a conta usada no pagamento.');
    const account = await this.accounts.findOne(accountId);
    const type = r.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
    const date = dto.date ? businessDate(dto.date) : occ.dueDate;
    const amountCents = dto.amount != null ? toCents(dto.amount) : toCents(r.amount) * occ.multiplier;
    const label = occ.installmentNumber && r.totalInstallments ? ` (${occ.installmentNumber}/${r.totalInstallments})` : '';

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.transaction.create({
        data: {
          userId: USER_ID,
          accountId: account.id,
          categoryId: r.categoryId,
          amount: new Prisma.Decimal(fromCents(amountCents).toFixed(2)),
          date,
          description: `${r.name}${label}`,
          type,
          status: 'COMPLETED',
          nature: type === 'EXPENSE' ? (DEFAULT_NATURE[r.type] ?? null) : null,
          recurringExpenseId: r.id,
          occurrenceMonth: dto.month,
          invoiceMonth: account.type === AccountType.CREDIT_CARD ? invoiceMonthFor(date, account.closingDay) : null,
        },
      });
      await applyTransactionEffects(tx, row, 1);
      return row;
    });
    await this.completeIfFinished(r.id);
    return created;
  }

  /** Desfaz o pago do mês: lançamento manual é apagado (saldo revertido); extrato só perde o vínculo. */
  async undoPayBill(id: string, month: string) {
    const r = await this.findOne(id);
    const existing = await this.prisma.transaction.findFirst({
      where: { recurringExpenseId: id, occurrenceMonth: month, userId: USER_ID },
    });
    if (!existing) throw new BadRequestException('Nenhum pagamento encontrado para este mês.');

    await this.prisma.$transaction(async (tx) => {
      if (existing.source === DataSource.PLUGGY) {
        await tx.transaction.update({
          where: { id: existing.id },
          data: { recurringExpenseId: null, occurrenceMonth: null },
        });
      } else {
        await applyTransactionEffects(tx, existing, -1);
        await tx.transaction.delete({ where: { id: existing.id } });
      }
      if (r.status === 'COMPLETED') {
        await tx.recurringExpense.update({ where: { id }, data: { status: 'ACTIVE' } });
      }
    });
    return { success: true };
  }

  private async completeIfFinished(id: string) {
    const r = await this.prisma.recurringExpense.findUnique({ where: { id } });
    if (!r?.totalInstallments) return;
    const paid = await this.prisma.transaction.count({
      where: { recurringExpenseId: id, status: 'COMPLETED', occurrenceMonth: { not: null } },
    });
    if (remainingInstallments(r, paid) === 0) {
      await this.prisma.recurringExpense.update({ where: { id }, data: { status: 'COMPLETED' } });
    }
  }
}

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}
