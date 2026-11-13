/**
 * Regras puras de dinheiro e calendário. Sem Prisma, para serem testáveis isoladamente.
 *
 * Convenções:
 * - Datas de negócio (dia sem hora) são gravadas às 12:00 UTC; o mês/dia de negócio é lido em UTC.
 * - Valores agregados são somados em centavos inteiros para não acumular erro de float.
 */

export type MonthKey = string; // YYYY-MM

export const toCents = (value: unknown): number => Math.round(Number(value ?? 0) * 100);
export const fromCents = (cents: number): number => Math.round(cents) / 100;

export function businessDate(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate(), 12));
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error(`Data inválida: ${input}`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
}

/** "Hoje" no calendário local do servidor, ou o dia informado pelo cliente (YYYY-MM-DD). */
export function today(clientToday?: string): Date {
  if (clientToday && /^\d{4}-\d{2}-\d{2}$/.test(clientToday)) return businessDate(clientToday);
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
}

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthKey(date: Date): MonthKey {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function parseMonth(month: MonthKey): { year: number; m: number } {
  if (!isMonthKey(month)) throw new Error(`Mês inválido: ${month}`);
  const [y, m] = month.split('-').map(Number);
  return { year: y, m: m - 1 };
}

export function addMonthsToKey(month: MonthKey, delta: number): MonthKey {
  const { year, m } = parseMonth(month);
  return monthKey(new Date(Date.UTC(year, m + delta, 1, 12)));
}

export function monthDiff(from: MonthKey, to: MonthKey): number {
  const a = parseMonth(from);
  const b = parseMonth(to);
  return (b.year - a.year) * 12 + (b.m - a.m);
}

export function daysInMonth(month: MonthKey): number {
  const { year, m } = parseMonth(month);
  return new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
}

/** Intervalo [start, end) do mês em UTC. */
export function monthRange(month: MonthKey): { start: Date; end: Date } {
  const { year, m } = parseMonth(month);
  return { start: new Date(Date.UTC(year, m, 1)), end: new Date(Date.UTC(year, m + 1, 1)) };
}

/** Dia `day` do mês, limitado ao último dia (31 → 30/28). */
export function dayInMonth(month: MonthKey, day: number): Date {
  const { year, m } = parseMonth(month);
  const clamped = Math.min(Math.max(1, day), daysInMonth(month));
  return new Date(Date.UTC(year, m, clamped, 12));
}

/** Soma meses mantendo o dia (limitado ao fim do mês). */
export function addMonths(date: Date, delta: number): Date {
  return dayInMonth(addMonthsToKey(monthKey(date), delta), date.getUTCDate());
}

/** Divide em N parcelas; os centavos que sobram vão para a 1ª. */
export function splitInstallments(totalCents: number, n: number): number[] {
  const count = Math.max(1, Math.floor(n));
  const base = Math.floor(totalCents / count);
  const rest = totalCents - base * count;
  return Array.from({ length: count }, (_, i) => (i === 0 ? base + rest : base));
}

/**
 * Mês em que a fatura que recebe esta compra fecha.
 * Compra no dia do fechamento ou depois cai na fatura seguinte.
 */
export function invoiceMonthFor(date: Date, closingDay?: number | null): MonthKey {
  const key = monthKey(date);
  if (!closingDay) return key;
  const closing = Math.min(closingDay, daysInMonth(key));
  return date.getUTCDate() >= closing ? addMonthsToKey(key, 1) : key;
}

export function invoiceDates(closingMonth: MonthKey, closingDay?: number | null, dueDay?: number | null) {
  const closing = dayInMonth(closingMonth, closingDay ?? daysInMonth(closingMonth));
  const due = dueDay
    ? dayInMonth(dueDay > (closingDay ?? 31) ? closingMonth : addMonthsToKey(closingMonth, 1), dueDay)
    : addMonths(closing, 0);
  return { closingDate: closing, dueDate: due };
}

export type Frequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export function monthlyEquivalentCents(amountCents: number, frequency: Frequency): number {
  if (frequency === 'WEEKLY') return Math.round((amountCents * 52) / 12);
  if (frequency === 'YEARLY') return Math.round(amountCents / 12);
  return amountCents;
}

export interface RecurringLike {
  frequency: Frequency;
  dueDay: number;
  startDate: Date;
  endDate: Date | null;
  firstInstallment: number;
  totalInstallments: number | null;
}

export interface Occurrence {
  dueDate: Date;
  installmentNumber: number | null;
  /** Semanal: quantas vezes cai no mês (o valor do mês é amount × multiplier). */
  multiplier: number;
}

/** Ocorrência de um compromisso em um mês, ou null se não vence nele. */
export function occurrenceInMonth(r: RecurringLike, month: MonthKey): Occurrence | null {
  const startMonth = monthKey(r.startDate);
  const idx = monthDiff(startMonth, month);
  if (idx < 0) return null;
  if (r.endDate && monthDiff(monthKey(r.endDate), month) > 0) return null;

  if (r.frequency === 'WEEKLY') {
    const { start, end } = monthRange(month);
    let first: Date | null = null;
    let count = 0;
    for (let t = r.startDate.getTime(); t < end.getTime(); t += 7 * 86_400_000) {
      if (t >= start.getTime()) {
        if (!first) first = new Date(t);
        count += 1;
      }
    }
    if (!first) return null;
    return { dueDate: businessDate(first), installmentNumber: null, multiplier: count };
  }

  if (r.frequency === 'YEARLY') {
    if (idx % 12 !== 0) return null;
    return { dueDate: dayInMonth(month, r.dueDay), installmentNumber: null, multiplier: 1 };
  }

  const installment = r.firstInstallment + idx;
  if (r.totalInstallments && installment > r.totalInstallments) return null;
  return {
    dueDate: dayInMonth(month, r.dueDay),
    installmentNumber: r.totalInstallments ? installment : null,
    multiplier: 1,
  };
}

/** Parcelas restantes de um compromisso parcelado, dado quantas já foram quitadas no app. */
export function remainingInstallments(r: Pick<RecurringLike, 'firstInstallment' | 'totalInstallments'>, paidCount: number) {
  if (!r.totalInstallments) return null;
  const lastPaid = r.firstInstallment - 1 + paidCount;
  return Math.max(0, r.totalInstallments - lastPaid);
}

/** Efeito de um lançamento concluído no saldo de cada conta envolvida (em centavos). */
export function balanceEffects(tx: {
  type: 'INCOME' | 'EXPENSE' | 'PAYMENT';
  amountCents: number;
  accountId: string;
  transferAccountId?: string | null;
}): Array<{ accountId: string; delta: number }> {
  if (tx.type === 'INCOME') return [{ accountId: tx.accountId, delta: tx.amountCents }];
  if (tx.type === 'EXPENSE') return [{ accountId: tx.accountId, delta: -tx.amountCents }];
  const effects = [{ accountId: tx.accountId, delta: -tx.amountCents }];
  if (tx.transferAccountId) effects.push({ accountId: tx.transferAccountId, delta: tx.amountCents });
  return effects;
}

/** Remove "(3/10)" do fim e normaliza, para agrupar por estabelecimento. */
export function merchantKey(description: string): string {
  return description
    .replace(/\s*\(\d+\/\d+\)\s*$/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}
