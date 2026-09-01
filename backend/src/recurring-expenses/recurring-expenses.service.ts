import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { Decimal } from '@prisma/client/runtime/library';

const USER_ID = 'user-id';

@Injectable()
export class RecurringExpensesService {
    constructor(private readonly prisma: PrismaService) { }

    create(dto: CreateRecurringExpenseDto) {
        return this.prisma.recurringExpense.create({
            data: {
                userId: USER_ID,
                name: dto.name,
                description: dto.description,
                type: dto.type as any,
                amount: new Decimal(dto.amount),
                frequency: (dto.frequency as any) ?? 'MONTHLY',
                dueDay: dto.dueDay,
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                currentInstallment: dto.currentInstallment,
                totalInstallments: dto.totalInstallments,
                interestRate: dto.interestRate != null ? new Decimal(dto.interestRate) : null,
                cardName: dto.cardName,
                color: dto.color ?? '#6366f1',
                icon: dto.icon ?? 'Repeat',
                categoryId: dto.categoryId || null,
                accountId: dto.accountId || null,
                nextDueDate: this.calculateNextDueDate(dto.startDate, dto.dueDay),
            },
            include: { category: true, account: true },
        });
    }

    findAll(type?: string, status?: string) {
        const where: any = { userId: USER_ID };
        if (type) where.type = type;
        if (status) where.status = status;
        return this.prisma.recurringExpense.findMany({
            where,
            include: { category: true, account: true },
            orderBy: [{ status: 'asc' }, { nextDueDate: 'asc' }, { name: 'asc' }],
        });
    }

    findOne(id: string) {
        return this.prisma.recurringExpense.findFirstOrThrow({
            where: { id, userId: USER_ID },
            include: { category: true, account: true },
        });
    }

    async update(id: string, dto: UpdateRecurringExpenseDto) {
        const data: Record<string, unknown> = {};

        if (dto.name !== undefined) data.name = dto.name;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.type !== undefined) data.type = dto.type;
        if (dto.amount !== undefined) data.amount = new Decimal(dto.amount);
        if (dto.frequency !== undefined) data.frequency = dto.frequency;
        if (dto.dueDay !== undefined) data.dueDay = dto.dueDay;
        if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
        if (dto.currentInstallment !== undefined) data.currentInstallment = dto.currentInstallment;
        if (dto.totalInstallments !== undefined) data.totalInstallments = dto.totalInstallments;
        if (dto.interestRate !== undefined) data.interestRate = dto.interestRate != null ? new Decimal(dto.interestRate) : null;
        if (dto.cardName !== undefined) data.cardName = dto.cardName;
        if (dto.color !== undefined) data.color = dto.color;
        if (dto.icon !== undefined) data.icon = dto.icon;
        if (dto.categoryId !== undefined) data.categoryId = dto.categoryId || null;
        if ((dto as any).accountId !== undefined) data.accountId = (dto as any).accountId || null;
        if ((dto as any).status !== undefined) data.status = (dto as any).status;

        return this.prisma.recurringExpense.update({
            where: { id },
            data,
            include: { category: true, account: true },
        });
    }

    remove(id: string) {
        return this.prisma.recurringExpense.delete({ where: { id } });
    }

    /** Calcula a próxima data de vencimento (horário fixo ao meio-dia UTC para evitar bug de fuso) */
    private calculateNextDueDate(startDate: string | Date, dueDay?: number): Date {
        const now = new Date();
        const start = new Date(startDate);
        const day = dueDay ?? start.getUTCDate();

        // Se a despesa começa no futuro, usamos o mês de início como base
        const baseDate = start > now ? start : now;

        let nextYear = baseDate.getFullYear();
        let nextMonth = baseDate.getMonth();
        let next = new Date(nextYear, nextMonth, day);

        if (next <= now && start <= now) {
            nextMonth += 1;
            next = new Date(nextYear, nextMonth, day);
        }

        // Retorna 12:00 UTC para estabilizar o dia independentemente do fuso do usuário
        return new Date(Date.UTC(next.getFullYear(), next.getMonth(), next.getDate(), 12, 0, 0));
    }

    /** Resumo para dashboard */
    async getSummary() {
        const expenses = await this.prisma.recurringExpense.findMany({
            where: { userId: USER_ID, status: 'ACTIVE' },
            include: { category: true },
        });

        const fixed = expenses.filter((e: typeof expenses[number]) => e.type === 'FIXED' || e.type === 'SUBSCRIPTION');
        const installments = expenses.filter((e: typeof expenses[number]) => e.type === 'INSTALLMENT' || e.type === 'CREDIT_CARD');
        const loans = expenses.filter((e: typeof expenses[number]) => e.type === 'LOAN');

        const totalFixed = fixed.reduce((sum: number, e: typeof expenses[number]) => sum + Number(e.amount), 0);
        const totalInstallments = installments.reduce((sum: number, e: typeof expenses[number]) => sum + Number(e.amount), 0);
        const totalLoans = loans.reduce((sum: number, e: typeof expenses[number]) => sum + Number(e.amount), 0);
        const totalMonthly = totalFixed + totalInstallments + totalLoans;

        return {
            totalMonthly,
            totalFixed,
            totalInstallments,
            totalLoans,
            fixedCount: fixed.length,
            installmentsCount: installments.length,
            loansCount: loans.length,
            totalCount: expenses.length,
        };
    }

    /** Busca as contas a pagar para um mês específico (YYYY-MM) */
    async getBills(month: string) {
        // month: "2026-03"
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr);
        const m = parseInt(monthStr) - 1;

        const startOfMonth = new Date(Date.UTC(year, m, 1, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999));

        // 1. Buscar gastos fixos ativos que se aplicam a este mês
        const expenses = await this.prisma.recurringExpense.findMany({
            where: {
                userId: USER_ID,
                status: 'ACTIVE',
                startDate: { lte: endOfMonth },
                OR: [
                    { endDate: null },
                    { endDate: { gte: startOfMonth } }
                ]
            },
            include: { category: true, account: true }
        });

        // 2. Buscar transações neste mês atreladas a essas despesas
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId: USER_ID,
                recurringExpenseId: { not: null },
                status: { not: 'CANCELLED' },
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        const txByExpenseId = new Map(transactions.map((t: any) => [t.recurringExpenseId, t]));

        // 3. Montar a resposta
        return expenses.map((exp: any) => {
            let dueDay = exp.dueDay || startOfMonth.getDate();
            // Evitar dia 31 num mês de 30 etc
            if (dueDay > new Date(year, m + 1, 0).getDate()) dueDay = new Date(year, m + 1, 0).getDate();

            // Setamos meio-dia UTC para evitar que voltem um dia por causa do fuso!
            const dueDate = new Date(Date.UTC(year, m, dueDay, 12, 0, 0));
            const tx: any = txByExpenseId.get(exp.id);

            return {
                id: `bill-${exp.id}-${month}`,
                recurringExpenseId: exp.id,
                name: exp.name,
                description: exp.description,
                type: exp.type,
                amount: exp.amount,
                color: exp.color,
                icon: exp.icon,
                dueDate: dueDate.toISOString(),
                isPaid: !!tx,
                paidVia: tx ? (tx.source === DataSource.PLUGGY ? 'EXTRACT' : 'MANUAL') : null,
                transactionId: tx?.id || null,
                category: exp.category,
                account: exp.account,
            };
        });
    }

    /** Candidatos do extrato para vincular a este compromisso no mês. */
    async findCandidates(id: string, month: string) {
        const expense = await this.prisma.recurringExpense.findFirst({
            where: { id, userId: USER_ID },
        });
        if (!expense) throw new NotFoundException('Compromisso não encontrado.');
        if (!month) throw new BadRequestException('Informe o mês (YYYY-MM).');

        const { startOfMonth, endOfMonth } = monthBounds(month);
        const amount = Number(expense.amount);
        const dueDay = expense.dueDay || startOfMonth.getUTCDate();
        const dueDate = new Date(Date.UTC(startOfMonth.getUTCFullYear(), startOfMonth.getUTCMonth(), dueDay, 12, 0, 0));
        const windowStart = new Date(startOfMonth);
        windowStart.setUTCDate(windowStart.getUTCDate() - 5);
        const windowEnd = new Date(endOfMonth);
        windowEnd.setUTCDate(windowEnd.getUTCDate() + 5);

        const txs = await this.prisma.transaction.findMany({
            where: {
                userId: USER_ID,
                source: DataSource.PLUGGY,
                status: { not: 'CANCELLED' },
                type: { in: ['EXPENSE', 'PAYMENT'] },
                date: { gte: windowStart, lte: windowEnd },
                OR: [
                    { recurringExpenseId: null },
                    { recurringExpenseId: id },
                ],
            },
            include: { account: true },
        });

        const tokens = tokenize(expense.name);
        const tolerance = Math.max(1, amount * 0.02);

        return txs
            .map((row) => {
                const txAmount = Number(row.amount);
                const amountDiff = Math.abs(txAmount - amount);
                if (amountDiff > tolerance) return null;
                const daysFromDue = Math.abs((row.date.getTime() - dueDate.getTime()) / 86_400_000);
                const desc = row.description.toLowerCase();
                const nameHit = tokens.some((t) => desc.includes(t));
                const score = (amountDiff === 0 ? 50 : 40 - Math.min(30, amountDiff)) + (nameHit ? 30 : 0) + Math.max(0, 20 - daysFromDue);
                return {
                    id: row.id,
                    date: row.date,
                    description: row.description,
                    amount: txAmount,
                    accountName: row.account.name,
                    score,
                };
            })
            .filter((row): row is NonNullable<typeof row> => row != null)
            .sort((a, b) => b.score - a.score)
            .slice(0, 12)
            .map(({ score: _score, ...rest }) => rest);
    }

    /** Pago = vínculo no extrato, ou registro manual do mês (sem mexer no saldo). */
    async payBill(id: string, month: string, transactionId?: string, accountId?: string) {
        const expense = await this.prisma.recurringExpense.findFirst({
            where: { id, userId: USER_ID },
        });
        if (!expense) throw new NotFoundException('Compromisso não encontrado.');

        const { startOfMonth, endOfMonth, year, m } = monthBounds(month);

        const already = await this.prisma.transaction.findFirst({
            where: {
                userId: USER_ID,
                recurringExpenseId: id,
                status: { not: 'CANCELLED' },
                date: { gte: startOfMonth, lte: endOfMonth },
            },
        });
        if (already) {
            throw new BadRequestException('Este compromisso já está marcado como pago neste mês.');
        }

        if (transactionId) {
            return this.linkExtract(expense, transactionId);
        }

        return this.markPaidWithoutExtract(expense, year, m, startOfMonth, accountId);
    }

    private async linkExtract(
        expense: { id: string; categoryId: string | null },
        transactionId: string,
    ) {
        const extract = await this.prisma.transaction.findFirst({
            where: { id: transactionId, userId: USER_ID },
        });
        if (!extract) throw new NotFoundException('Lançamento não encontrado.');
        if (extract.source !== DataSource.PLUGGY) {
            throw new BadRequestException('Só é possível vincular uma linha do extrato do banco.');
        }
        if (extract.status === 'CANCELLED') {
            throw new BadRequestException('Este lançamento foi anulado.');
        }
        if (extract.recurringExpenseId && extract.recurringExpenseId !== expense.id) {
            throw new BadRequestException('Este lançamento já está ligado a outro compromisso.');
        }

        return this.prisma.transaction.update({
            where: { id: extract.id },
            data: {
                recurringExpenseId: expense.id,
                ...(expense.categoryId ? { categoryId: expense.categoryId } : {}),
            },
        });
    }

    private async markPaidWithoutExtract(
        expense: { id: string; name: string; amount: unknown; dueDay: number | null; categoryId: string | null; accountId: string | null },
        year: number,
        m: number,
        startOfMonth: Date,
        accountId?: string,
    ) {
        const chosenAccountId = accountId || expense.accountId;
        if (!chosenAccountId) {
            throw new BadRequestException('Escolha uma conta para registrar o pagamento.');
        }

        let catId = expense.categoryId;
        if (!catId) {
            const fallbackCat = await this.prisma.category.findFirst({
                where: { userId: USER_ID, type: 'EXPENSE' },
            });
            if (!fallbackCat) {
                throw new BadRequestException('Crie uma categoria de despesa antes de marcar como pago.');
            }
            catId = fallbackCat.id;
        }

        const lastDay = new Date(year, m + 1, 0).getDate();
        let dueDay = expense.dueDay || startOfMonth.getUTCDate();
        if (dueDay > lastDay) dueDay = lastDay;
        const txDate = new Date(Date.UTC(year, m, dueDay, 12, 0, 0));

        return this.prisma.transaction.create({
            data: {
                userId: USER_ID,
                accountId: chosenAccountId,
                categoryId: catId,
                amount: expense.amount as any,
                date: txDate,
                description: `Pagamento: ${expense.name}`,
                type: 'EXPENSE',
                status: 'COMPLETED',
                isRecurring: true,
                recurringExpenseId: expense.id,
                metadata: { paidWithoutExtract: true },
            },
        });
    }

    /** Desfaz o pago do mês. Extrato do banco permanece; marcação manual é anulada. Sem alterar saldo. */
    async undoPayBill(id: string, month: string) {
        const { startOfMonth, endOfMonth } = monthBounds(month);

        const existingTx = await this.prisma.transaction.findFirst({
            where: {
                userId: USER_ID,
                recurringExpenseId: id,
                status: { not: 'CANCELLED' },
                date: { gte: startOfMonth, lte: endOfMonth },
            },
        });

        if (!existingTx) {
            throw new BadRequestException('Nenhum pagamento encontrado para este mês.');
        }

        if (existingTx.source === DataSource.PLUGGY) {
            await this.prisma.transaction.update({
                where: { id: existingTx.id },
                data: { recurringExpenseId: null },
            });
        } else {
            await this.prisma.transaction.update({
                where: { id: existingTx.id },
                data: { status: 'CANCELLED', recurringExpenseId: null },
            });
        }

        return { success: true };
    }
}

function monthBounds(month: string) {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10) - 1;
    if (!Number.isFinite(year) || !Number.isFinite(m) || m < 0 || m > 11) {
        throw new BadRequestException('Mês inválido. Use YYYY-MM.');
    }
    const startOfMonth = new Date(Date.UTC(year, m, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999));
    return { startOfMonth, endOfMonth, year, m };
}

function tokenize(name: string): string[] {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 2);
}
