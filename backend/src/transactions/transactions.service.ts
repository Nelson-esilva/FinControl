import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountType, DataSource, Prisma, SpendingNature, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { applyTransactionEffects } from '../accounts/ledger-balance';
import {
  addMonths,
  addMonthsToKey,
  businessDate,
  fromCents,
  invoiceMonthFor,
  splitInstallments,
  toCents,
} from '../ledger/rules';

const USER_ID = 'user-id';

export interface TransactionFilters {
  type?: string;
  status?: string;
  accountId?: string;
  categoryId?: string;
  nature?: string;
  tag?: string;
  q?: string;
  from?: string;
  to?: string;
  source?: string;
  parentTransactionId?: string;
  installments?: string; // "1" = só parcelados
  limit?: string;
}

export const TRANSACTION_INCLUDE = {
  account: { select: { id: true, name: true, type: true, color: true } },
  transferAccount: { select: { id: true, name: true, type: true, color: true } },
  category: { select: { id: true, name: true, color: true, icon: true, type: true } },
} satisfies Prisma.TransactionInclude;

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAccount(id: string) {
    const account = await this.prisma.account.findFirst({ where: { id, userId: USER_ID } });
    if (!account) throw new NotFoundException('Conta não encontrada.');
    return account;
  }

  private async validateRelations(dto: {
    type?: string;
    accountId?: string;
    transferAccountId?: string | null;
    categoryId?: string | null;
  }) {
    if (dto.type === 'PAYMENT') {
      if (!dto.transferAccountId) {
        throw new BadRequestException('Transferência precisa da conta de destino.');
      }
      if (dto.transferAccountId === dto.accountId) {
        throw new BadRequestException('A conta de destino deve ser diferente da de origem.');
      }
      await this.getAccount(dto.transferAccountId);
    }
    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({ where: { id: dto.categoryId, userId: USER_ID } });
      if (!cat) throw new NotFoundException('Categoria não encontrada.');
      if (dto.type && dto.type !== 'PAYMENT' && cat.type !== dto.type) {
        throw new BadRequestException('A categoria não é do mesmo tipo do lançamento.');
      }
    }
  }

  async create(dto: CreateTransactionDto) {
    const account = await this.getAccount(dto.accountId);
    await this.validateRelations(dto);

    const isPayment = dto.type === 'PAYMENT';
    const isCard = account.type === AccountType.CREDIT_CARD;
    const count = !isPayment && dto.totalInstallments && dto.totalInstallments > 1 ? dto.totalInstallments : 1;
    const parts = splitInstallments(toCents(dto.amount), count);
    const firstDate = businessDate(dto.date);
    const firstInvoice = isCard && !isPayment ? invoiceMonthFor(firstDate, account.closingDay) : null;
    const tags = normalizeTags(dto.tags);

    return this.prisma.$transaction(async (tx) => {
      let parentId: string | null = null;
      let first: Prisma.TransactionGetPayload<{ include: typeof TRANSACTION_INCLUDE }> | null = null;

      for (let i = 0; i < count; i++) {
        // Compra no cartão vira dívida inteira na hora (todas COMPLETED, uma por fatura).
        // Fora do cartão, parcelas futuras ficam SCHEDULED e só mexem no saldo ao pagar.
        const status = i === 0 || isCard ? (dto.status ?? 'COMPLETED') : 'SCHEDULED';
        const row: Prisma.TransactionGetPayload<{ include: typeof TRANSACTION_INCLUDE }> = await tx.transaction.create({
          data: {
            userId: USER_ID,
            accountId: account.id,
            transferAccountId: isPayment ? dto.transferAccountId : null,
            categoryId: isPayment ? null : (dto.categoryId ?? null),
            amount: new Prisma.Decimal(fromCents(parts[i]).toFixed(2)),
            date: addMonths(firstDate, i),
            description: dto.description.trim(),
            type: dto.type,
            status,
            nature: dto.type === 'EXPENSE' ? (dto.nature ?? null) : null,
            note: dto.note?.trim() || null,
            tags,
            installmentNumber: count > 1 ? i + 1 : null,
            totalInstallments: count > 1 ? count : null,
            parentTransactionId: parentId,
            invoiceMonth: firstInvoice ? addMonthsToKey(firstInvoice, i) : isPayment ? (dto.invoiceMonth ?? null) : null,
          },
          include: TRANSACTION_INCLUDE,
        });
        await applyTransactionEffects(tx, row, 1);
        if (i === 0) {
          parentId = row.id;
          first = row;
        }
      }
      return first;
    });
  }

  findAll(f: TransactionFilters = {}) {
    const where: Prisma.TransactionWhereInput = { userId: USER_ID };
    if (f.type) where.type = f.type as TransactionType;
    where.status = f.status ? (f.status as TransactionStatus) : { not: 'CANCELLED' };
    if (f.accountId) where.OR = [{ accountId: f.accountId }, { transferAccountId: f.accountId }];
    if (f.categoryId) where.categoryId = f.categoryId;
    if (f.nature) where.nature = f.nature as SpendingNature;
    if (f.tag) where.tags = { has: f.tag.toLowerCase() };
    if (f.source) where.source = f.source as DataSource;
    if (f.parentTransactionId) where.parentTransactionId = f.parentTransactionId;
    if (f.installments === '1') where.totalInstallments = { gt: 1 };
    if (f.q?.trim()) {
      const q = f.q.trim();
      where.AND = [
        {
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { note: { contains: q, mode: 'insensitive' } },
            { tags: { has: q.replace(/^#/, '').toLowerCase() } },
            { category: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }
    if (f.from || f.to) {
      const date: Prisma.DateTimeFilter = {};
      if (f.from) date.gte = new Date(`${f.from.slice(0, 10)}T00:00:00.000Z`);
      if (f.to) date.lte = new Date(`${f.to.slice(0, 10)}T23:59:59.999Z`);
      where.date = date;
    }
    const limit = Math.min(Number(f.limit) || 500, 2000);
    return this.prisma.transaction.findMany({
      where,
      include: TRANSACTION_INCLUDE,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async listTags() {
    const rows = await this.prisma.transaction.findMany({
      where: { userId: USER_ID, tags: { isEmpty: false } },
      select: { tags: true },
      take: 2000,
      orderBy: { date: 'desc' },
    });
    return Array.from(new Set(rows.flatMap((r) => r.tags))).sort();
  }

  async findOne(id: string) {
    const row = await this.prisma.transaction.findFirst({
      where: { id, userId: USER_ID },
      include: { ...TRANSACTION_INCLUDE, attachments: true, childTransactions: { orderBy: { installmentNumber: 'asc' } } },
    });
    if (!row) throw new NotFoundException('Lançamento não encontrado.');
    return row;
  }

  async update(id: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(id);
    const type = dto.type ?? existing.type;
    const accountId = dto.accountId ?? existing.accountId;
    const transferAccountId =
      type === 'PAYMENT' ? (dto.transferAccountId ?? existing.transferAccountId) : null;
    const categoryId = type === 'PAYMENT' ? null : dto.categoryId !== undefined ? dto.categoryId : existing.categoryId;
    const account = await this.getAccount(accountId);
    await this.validateRelations({ type, accountId, transferAccountId, categoryId });

    if (existing.source === DataSource.PLUGGY && (dto.amount != null || dto.accountId || dto.type)) {
      throw new BadRequestException('Lançamento do extrato: só categoria, natureza, tags e nota podem mudar.');
    }

    const date = dto.date ? businessDate(dto.date) : existing.date;
    const invoiceMonth =
      account.type === AccountType.CREDIT_CARD && type !== 'PAYMENT'
        ? dto.date || dto.accountId
          ? invoiceMonthFor(date, account.closingDay)
          : existing.invoiceMonth
        : type === 'PAYMENT'
          ? (dto.invoiceMonth ?? existing.invoiceMonth)
          : null;

    return this.prisma.$transaction(async (tx) => {
      await applyTransactionEffects(tx, existing, -1);
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          type,
          accountId,
          transferAccountId,
          categoryId,
          date,
          invoiceMonth,
          status: dto.status ?? existing.status,
          description: dto.description?.trim() ?? existing.description,
          amount: dto.amount != null ? new Prisma.Decimal(dto.amount.toFixed(2)) : existing.amount,
          nature: type === 'EXPENSE' ? (dto.nature !== undefined ? dto.nature : existing.nature) : null,
          note: dto.note !== undefined ? dto.note.trim() || null : existing.note,
          tags: dto.tags !== undefined ? normalizeTags(dto.tags) : existing.tags,
        },
        include: TRANSACTION_INCLUDE,
      });
      await applyTransactionEffects(tx, updated, 1);
      return updated;
    });
  }

  async pay(id: string) {
    const existing = await this.findOne(id);
    if (existing.status === 'COMPLETED') throw new BadRequestException('Este lançamento já está pago.');
    if (existing.status === 'CANCELLED') throw new BadRequestException('Lançamento anulado.');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: TRANSACTION_INCLUDE,
      });
      await applyTransactionEffects(tx, updated, 1);
      return updated;
    });
  }

  async unpay(id: string) {
    const existing = await this.findOne(id);
    if (existing.status !== 'COMPLETED') throw new BadRequestException('Este lançamento não está pago.');
    if (existing.source === DataSource.PLUGGY) throw new BadRequestException('Lançamento do extrato não pode ser desfeito.');
    return this.prisma.$transaction(async (tx) => {
      await applyTransactionEffects(tx, existing, -1);
      return tx.transaction.update({ where: { id }, data: { status: 'SCHEDULED' }, include: TRANSACTION_INCLUDE });
    });
  }

  /** scope "all" apaga o parcelamento inteiro a partir do lançamento pai. */
  async remove(id: string, scope: 'one' | 'all' = 'one') {
    const existing = await this.findOne(id);
    const rootId = existing.parentTransactionId ?? existing.id;
    const rows =
      scope === 'all' && existing.totalInstallments
        ? await this.prisma.transaction.findMany({
            where: { userId: USER_ID, OR: [{ id: rootId }, { parentTransactionId: rootId }] },
          })
        : [existing];

    return this.prisma.$transaction(async (tx) => {
      for (const row of rows) await applyTransactionEffects(tx, row, -1);
      const ids = rows.map((r) => r.id);
      if (scope === 'one' && existing.childTransactions.length > 0) {
        // Apagar só o pai: a próxima parcela vira o novo pai (a FK tem cascade).
        const [next, ...others] = existing.childTransactions;
        await tx.transaction.update({ where: { id: next.id }, data: { parentTransactionId: null } });
        await tx.transaction.updateMany({
          where: { id: { in: others.map((o) => o.id) } },
          data: { parentTransactionId: next.id },
        });
      }
      // Filhas primeiro para não violar a FK do pai.
      await tx.transaction.deleteMany({ where: { id: { in: ids }, parentTransactionId: { not: null } } });
      await tx.transaction.deleteMany({ where: { id: { in: ids } } });
      return { deleted: ids.length };
    });
  }
}

function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];
  return Array.from(
    new Set(
      tags
        .map((t) => t.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-'))
        .filter((t) => t.length > 0),
    ),
  );
}
