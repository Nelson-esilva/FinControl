import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountType, DataSource, Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { PluggyClient, PluggyAccountPayload, PluggyItemPayload, PluggyTransactionPayload } from './pluggy.client';
import { PluggyWebhookDto } from './dto/pluggy-webhook.dto';
import { RegisterPluggyItemDto } from './dto/register-item.dto';

const USER_ID = 'user-id';
const IMPORT_CATEGORY = 'Importado';

@Injectable()
export class PluggyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly client: PluggyClient,
  ) {}

  findAll() {
    return this.prisma.pluggyItem.findMany({
      where: { userId: USER_ID },
      include: { _count: { select: { accounts: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async register(dto: RegisterPluggyItemDto) {
    this.client.assertConfigured();
    const remote = await this.fetchRemoteItem(dto.itemId);
    const row = await this.upsertItem(remote);
    const summary = await this.syncItem(row.id);
    const updated = await this.prisma.pluggyItem.findFirstOrThrow({ where: { id: row.id } });
    return { ...updated, ...summary };
  }

  async syncByLocalId(id: string) {
    this.client.assertConfigured();
    const existing = await this.prisma.pluggyItem.findFirst({
      where: { id, userId: USER_ID },
    });
    if (!existing) throw new NotFoundException('Conexão Pluggy não encontrada.');
    const remote = await this.fetchRemoteItem(existing.pluggyItemId);
    await this.upsertItem(remote, existing.id);
    const summary = await this.syncItem(existing.id);
    const updated = await this.prisma.pluggyItem.findFirstOrThrow({ where: { id: existing.id } });
    return { ...updated, ...summary };
  }

  async unlink(id: string) {
    const existing = await this.prisma.pluggyItem.findFirst({
      where: { id, userId: USER_ID },
    });
    if (!existing) throw new NotFoundException('Conexão Pluggy não encontrada.');

    await this.prisma.$transaction(async (tx) => {
      await tx.account.updateMany({
        where: { pluggyItemId: existing.id, userId: USER_ID },
        data: { isActive: false },
      });
      await tx.pluggyItem.delete({ where: { id: existing.id } });
    });
    return { ok: true };
  }

  assertWebhookSecret(header?: string) {
    const expected = process.env.PLUGGY_WEBHOOK_HEADER?.trim();
    if (!expected) return;
    if (!header || header !== expected) {
      throw new UnauthorizedException('Webhook recusado.');
    }
  }

  async handleWebhook(dto: PluggyWebhookDto) {
    if (dto.eventId) {
      try {
        await this.prisma.pluggyWebhookEvent.create({
          data: { eventId: dto.eventId, event: dto.event },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          return;
        }
        throw err;
      }
    }

    if (dto.event === 'transactions/deleted' && dto.transactionIds?.length) {
      await this.deleteImported(dto.transactionIds);
      return;
    }

    if (dto.event === 'transactions/updated' && dto.transactionIds?.length) {
      const payloads = await this.client.listTransactionsByIds(dto.transactionIds);
      const categories = await this.ensureImportCategories();
      for (const payload of payloads) {
        await this.upsertImportedTransaction(payload, categories);
      }
      return;
    }

    if (dto.event === 'transactions/created') {
      const link = dto.createdTransactionsLinkV2 || dto.createdTransactionsLink;
      if (link) {
        const payloads = await this.client.fetchTransactionPage(link);
        const categories = await this.ensureImportCategories();
        for (const payload of payloads) {
          await this.upsertImportedTransaction(payload, categories);
        }
        return;
      }
    }

    if (!dto.itemId) return;
    const local = await this.prisma.pluggyItem.findFirst({
      where: { pluggyItemId: dto.itemId, userId: USER_ID },
    });
    if (!local) return;

    if (dto.event === 'item/error') {
      await this.prisma.pluggyItem.update({
        where: { id: local.id },
        data: { status: 'ERROR', lastError: 'Erro na conexão Meu Pluggy' },
      });
      return;
    }

    await this.syncByLocalId(local.id);
  }

  private async fetchRemoteItem(itemId: string): Promise<PluggyItemPayload> {
    try {
      return await this.client.fetchItem(itemId);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 404) {
        throw new BadRequestException('Item ID não encontrado na Pluggy.');
      }
      throw err;
    }
  }

  private async upsertItem(remote: PluggyItemPayload, localId?: string) {
    const data = {
      pluggyItemId: remote.id,
      connectorId: remote.connector?.id,
      connectorName: remote.connector?.name ?? 'MeuPluggy',
      status: remote.status ?? null,
      executionStatus: remote.executionStatus ?? null,
      lastError: remote.error?.message ?? null,
      userId: USER_ID,
    };
    if (localId) {
      return this.prisma.pluggyItem.update({ where: { id: localId }, data });
    }
    return this.prisma.pluggyItem.upsert({
      where: { pluggyItemId: remote.id },
      create: data,
      update: data,
    });
  }

  private async syncItem(localItemId: string) {
    const local = await this.prisma.pluggyItem.findFirstOrThrow({
      where: { id: localItemId, userId: USER_ID },
    });
    const accounts = await this.client.listAccounts(local.pluggyItemId);
    const categories = await this.ensureImportCategories();
    let accountCount = 0;
    let transactionCount = 0;

    for (const remoteAccount of accounts) {
      const account = await this.upsertAccount(local.id, remoteAccount);
      accountCount += 1;
      const txs = await this.client.listTransactions(remoteAccount.id);
      for (const tx of txs) {
        await this.upsertImportedTransaction(tx, categories, account.id);
        transactionCount += 1;
      }
    }

    await this.prisma.pluggyItem.update({
      where: { id: local.id },
      data: { lastSyncedAt: new Date(), lastError: null },
    });

    return { accountCount, transactionCount };
  }

  private async upsertAccount(localItemId: string, remote: PluggyAccountPayload) {
    const type = mapAccountType(remote);
    const now = new Date();
    const currentBalance = mapBalance(remote, type);
    const creditLimit = toDecimal(remote.creditData?.creditLimit);
    const dueDate = dueDayFrom(remote.creditData?.balanceDueDate);
    const name = accountName(remote);

    const existing = await this.prisma.account.findUnique({
      where: { pluggyAccountId: remote.id },
    });

    const data = {
      name,
      type,
      currentBalance,
      creditLimit,
      dueDate,
      source: DataSource.PLUGGY,
      isActive: true,
      lastSyncedAt: now,
      pluggyItemId: localItemId,
      userId: USER_ID,
      icon: type === AccountType.CREDIT_CARD ? 'CreditCard' : 'Landmark',
    };

    if (existing) {
      return this.prisma.account.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.account.create({
      data: {
        ...data,
        pluggyAccountId: remote.id,
        initialBalance: currentBalance,
      },
    });
  }

  private async upsertImportedTransaction(
    payload: PluggyTransactionPayload,
    categories: { incomeId: string; expenseId: string },
    knownAccountId?: string,
  ) {
    if (!payload.id) return;
    const type = payload.type === 'CREDIT' ? TransactionType.INCOME : TransactionType.EXPENSE;
    const status =
      payload.status === 'PENDING' ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;
    const amount = toDecimal(Math.abs(Number(payload.amount ?? 0)));
    const date = payload.date ? new Date(payload.date) : new Date();
    const description = (payload.description || 'Lançamento importado').slice(0, 500);
    const categoryId = type === TransactionType.INCOME ? categories.incomeId : categories.expenseId;

    let accountId = knownAccountId;
    if (!accountId && payload.accountId) {
      const account = await this.prisma.account.findUnique({
        where: { pluggyAccountId: payload.accountId },
        select: { id: true },
      });
      accountId = account?.id;
    }
    if (!accountId) return;

    const data = {
      amount,
      date,
      description,
      type,
      status,
      categoryId,
      accountId,
      source: DataSource.PLUGGY,
      metadata: payload.category ? { pluggyCategory: payload.category } : undefined,
    };

    await this.prisma.transaction.upsert({
      where: { pluggyTransactionId: payload.id },
      create: {
        ...data,
        userId: USER_ID,
        pluggyTransactionId: payload.id,
      },
      update: data,
    });
  }

  private async deleteImported(pluggyTransactionIds: string[]) {
    await this.prisma.transaction.deleteMany({
      where: {
        userId: USER_ID,
        source: DataSource.PLUGGY,
        pluggyTransactionId: { in: pluggyTransactionIds },
      },
    });
  }

  private async ensureImportCategories() {
    const [income, expense] = await Promise.all([
      this.prisma.category.upsert({
        where: { userId_name_type: { userId: USER_ID, name: IMPORT_CATEGORY, type: TransactionType.INCOME } },
        create: {
          userId: USER_ID,
          name: IMPORT_CATEGORY,
          type: TransactionType.INCOME,
          color: '#10b981',
          icon: 'Download',
          isDefault: true,
        },
        update: {},
      }),
      this.prisma.category.upsert({
        where: { userId_name_type: { userId: USER_ID, name: IMPORT_CATEGORY, type: TransactionType.EXPENSE } },
        create: {
          userId: USER_ID,
          name: IMPORT_CATEGORY,
          type: TransactionType.EXPENSE,
          color: '#f43f5e',
          icon: 'Download',
          isDefault: true,
        },
        update: {},
      }),
    ]);
    return { incomeId: income.id, expenseId: expense.id };
  }
}

function mapAccountType(remote: PluggyAccountPayload): AccountType {
  const type = (remote.type || '').toUpperCase();
  const subtype = (remote.subtype || '').toUpperCase();
  if (type === 'CREDIT' || subtype.includes('CREDIT')) return AccountType.CREDIT_CARD;
  if (subtype.includes('SAVING')) return AccountType.SAVINGS;
  if (type === 'BROKERAGE' || subtype.includes('INVEST')) return AccountType.INVESTMENT;
  if (type === 'BANK' || subtype.includes('CHECKING')) return AccountType.CHECKING;
  return AccountType.OTHER;
}

function mapBalance(remote: PluggyAccountPayload, type: AccountType): Decimal {
  const raw = Number(remote.balance ?? 0);
  if (type === AccountType.CREDIT_CARD) {
    return toDecimal(raw === 0 ? 0 : -Math.abs(raw));
  }
  return toDecimal(raw);
}

function accountName(remote: PluggyAccountPayload): string {
  const base = remote.name?.trim() || 'Conta Meu Pluggy';
  const tail = remote.number ? remote.number.replace(/\D/g, '').slice(-4) : '';
  return tail && !base.includes(tail) ? `${base} • ${tail}` : base;
}

function dueDayFrom(iso?: string): number | undefined {
  if (!iso) return undefined;
  const day = Number(iso.slice(8, 10));
  return day >= 1 && day <= 31 ? day : undefined;
}

function toDecimal(value: number | undefined | null): Decimal {
  const n = Number(value ?? 0);
  return new Decimal((Number.isFinite(n) ? n : 0).toFixed(2));
}
