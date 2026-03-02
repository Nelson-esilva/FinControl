import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { Decimal } from '@prisma/client/runtime/library';

const USER_ID = 'user-id';

@Injectable()
export class RecurringExpensesService {
    constructor(private readonly prisma: PrismaService) { }

    create(dto: CreateRecurringExpenseDto) {
        return this.prisma.$transaction(async (tx: any) => {
            const recurring = await tx.recurringExpense.create({
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

            if (dto.accountId && dto.categoryId) {
                await tx.transaction.create({
                    data: {
                        userId: USER_ID,
                        accountId: dto.accountId,
                        categoryId: dto.categoryId,
                        amount: new Decimal(dto.amount),
                        date: new Date(dto.startDate),
                        description: `Despesa Recorrente: ${dto.name}`,
                        type: 'EXPENSE',
                        status: 'COMPLETED',
                        isRecurring: true,
                    },
                });
                await tx.account.update({
                    where: { id: dto.accountId },
                    data: { currentBalance: { decrement: new Decimal(dto.amount) } },
                });
            }
            return recurring;
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
                transactionId: tx?.id || null,
                category: exp.category,
                account: exp.account,
            };
        });
    }

    /** Marca uma despesa como paga neste mês, gerando a transação */
    async payBill(id: string, month: string, accountId?: string) {
        return this.prisma.$transaction(async (tx: any) => {
            const expense = await tx.recurringExpense.findFirstOrThrow({
                where: { id, userId: USER_ID }
            });

            const [yearStr, monthStr] = month.split('-');
            const year = parseInt(yearStr);
            const m = parseInt(monthStr) - 1;

            const startOfMonth = new Date(year, m, 1);
            const endOfMonth = new Date(year, m + 1, 0, 23, 59, 59, 999);

            // Verifica se já não pagou
            const existingTx = await tx.transaction.findFirst({
                where: {
                    userId: USER_ID,
                    recurringExpenseId: id,
                    date: { gte: startOfMonth, lte: endOfMonth }
                }
            });

            if (existingTx) {
                throw new Error("Conta já paga para este mês.");
            }

            let dueDay = expense.dueDay || startOfMonth.getDate();
            if (dueDay > endOfMonth.getDate()) dueDay = endOfMonth.getDate();
            const txDate = new Date(year, m, dueDay);

            const chosenAccountId = accountId || expense.accountId;
            if (!chosenAccountId) {
                throw new Error("AccountId é obrigatório para pagamento.");
            }

            let catId = expense.categoryId;
            if (!catId) {
                const fallbackCat = await tx.category.findFirst({
                    where: { userId: USER_ID, type: "EXPENSE" }
                });
                if (!fallbackCat) {
                    throw new Error("Nenhuma categoria vinculada ou encontrada. Crie uma categoria antes de pagar.");
                }
                catId = fallbackCat.id;
            }

            const trans = await tx.transaction.create({
                data: {
                    userId: USER_ID,
                    accountId: chosenAccountId,
                    categoryId: catId,
                    amount: expense.amount,
                    date: txDate,
                    description: `Pagamento: ${expense.name}`,
                    type: "EXPENSE",
                    status: "COMPLETED",
                    isRecurring: true,
                    recurringExpenseId: expense.id
                }
            });

            // Atualiza saldo
            await tx.account.update({
                where: { id: chosenAccountId },
                data: { currentBalance: { decrement: expense.amount } }
            });

            return trans;
        });
    }

    /** Desfaz o pagamento de uma despesa recorrente neste mês, removendo a transação gerada */
    async undoPayBill(id: string, month: string) {
        return this.prisma.$transaction(async (tx: any) => {
            const [yearStr, monthStr] = month.split('-');
            const year = parseInt(yearStr);
            const m = parseInt(monthStr) - 1;

            const startOfMonth = new Date(year, m, 1);
            const endOfMonth = new Date(year, m + 1, 0, 23, 59, 59, 999);

            const existingTx = await tx.transaction.findFirst({
                where: {
                    userId: USER_ID,
                    recurringExpenseId: id,
                    date: { gte: startOfMonth, lte: endOfMonth }
                }
            });

            if (!existingTx) {
                throw new Error("Nenhum pagamento encontrado para este mês.");
            }

            // Exclui a transação correspondente
            await tx.transaction.delete({
                where: { id: existingTx.id }
            });

            // Reembolsa o saldo
            if (existingTx.accountId) {
                await tx.account.update({
                    where: { id: existingTx.accountId },
                    data: { currentBalance: { increment: existingTx.amount } }
                });
            }

            return { success: true };
        });
    }
}
