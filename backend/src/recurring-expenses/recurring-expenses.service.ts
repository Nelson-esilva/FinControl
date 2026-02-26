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
        return this.prisma.$transaction(async (tx) => {
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

    /** Calcula a próxima data de vencimento */
    private calculateNextDueDate(startDate: string, dueDay?: number): Date {
        const now = new Date();
        const start = new Date(startDate);
        const day = dueDay ?? start.getDate();
        let next = new Date(now.getFullYear(), now.getMonth(), day);
        if (next <= now) {
            next.setMonth(next.getMonth() + 1);
        }
        return next;
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
}
