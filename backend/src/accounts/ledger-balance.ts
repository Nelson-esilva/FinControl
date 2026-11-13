import { DataSource, Prisma } from '@prisma/client';
import { balanceEffects, toCents } from '../ledger/rules';

/** Saldo de conta PLUGGY só muda no sync. Conta MANUAL segue o ledger. */
export async function applyLedgerBalanceIfManual(
  tx: Prisma.TransactionClient,
  accountId: string,
  delta: number,
) {
  if (!Number.isFinite(delta) || delta === 0) return;
  const account = await tx.account.findUnique({
    where: { id: accountId },
    select: { source: true },
  });
  if (!account || account.source === DataSource.PLUGGY) return;
  await tx.account.update({
    where: { id: accountId },
    data: { currentBalance: { increment: new Prisma.Decimal(delta.toFixed(2)) } },
  });
}

type LedgerRow = {
  type: 'INCOME' | 'EXPENSE' | 'PAYMENT';
  status: string;
  amount: Prisma.Decimal | number | string;
  accountId: string;
  transferAccountId?: string | null;
};

/**
 * Único ponto que mexe em saldo por lançamento. Só lançamento COMPLETED afeta saldo.
 * sign = 1 aplica, -1 reverte. Deve rodar dentro de prisma.$transaction.
 */
export async function applyTransactionEffects(tx: Prisma.TransactionClient, row: LedgerRow, sign: 1 | -1) {
  if (row.status !== 'COMPLETED') return;
  const effects = balanceEffects({
    type: row.type,
    amountCents: toCents(row.amount),
    accountId: row.accountId,
    transferAccountId: row.transferAccountId,
  });
  for (const e of effects) {
    await applyLedgerBalanceIfManual(tx, e.accountId, (sign * e.delta) / 100);
  }
}
