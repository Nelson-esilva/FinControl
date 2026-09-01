import { DataSource, Prisma } from '@prisma/client';

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
    data: { currentBalance: { increment: delta } },
  });
}

/** Lançamentos que o app inventava ao cadastrar/pagar recorrente — não são extrato. */
export const hideSyntheticLedgerTx: Prisma.TransactionWhereInput = {
  NOT: {
    source: DataSource.MANUAL,
    isRecurring: true,
    OR: [
      { description: { startsWith: 'Pagamento:' } },
      { description: { startsWith: 'Despesa Recorrente:' } },
    ],
  },
};
