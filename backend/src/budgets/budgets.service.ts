import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { daysInMonth, fromCents, isMonthKey, monthKey, monthRange, toCents, today as todayDate } from '../ledger/rules';

const USER_ID = 'user-id';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: CreateBudgetDto) {
    const cat = await this.prisma.category.findFirst({ where: { id: dto.categoryId, userId: USER_ID } });
    if (!cat) throw new NotFoundException('Categoria não encontrada.');
    if (cat.type !== 'EXPENSE') throw new BadRequestException('Orçamento só vale para categorias de gasto.');
    const amount = new Prisma.Decimal(dto.amount.toFixed(2));
    return this.prisma.budget.upsert({
      where: { userId_categoryId: { userId: USER_ID, categoryId: dto.categoryId } },
      create: { userId: USER_ID, categoryId: dto.categoryId, amount, alertAt80: dto.alertAt80, alertAt100: dto.alertAt100 },
      update: { amount, alertAt80: dto.alertAt80, alertAt100: dto.alertAt100 },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateBudgetDto) {
    await this.findOne(id);
    return this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.amount != null ? { amount: new Prisma.Decimal(dto.amount.toFixed(2)) } : {}),
        alertAt80: dto.alertAt80,
        alertAt100: dto.alertAt100,
      },
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.budget.delete({ where: { id } });
  }

  private async findOne(id: string) {
    const b = await this.prisma.budget.findFirst({ where: { id, userId: USER_ID } });
    if (!b) throw new NotFoundException('Orçamento não encontrado.');
    return b;
  }

  async forMonth(month?: string, clientToday?: string) {
    const now = todayDate(clientToday);
    const key = month ?? monthKey(now);
    if (!isMonthKey(key)) throw new BadRequestException('Mês inválido. Use YYYY-MM.');
    const { start, end } = monthRange(key);
    const totalDays = daysInMonth(key);
    const current = monthKey(now);
    const elapsed = key < current ? totalDays : key > current ? 0 : now.getUTCDate();
    const daysLeft = Math.max(1, totalDays - elapsed + (key === current ? 1 : 0));
    const pacePct = Math.round((elapsed / totalDays) * 100);

    const [budgets, spentRows, categories] = await Promise.all([
      this.prisma.budget.findMany({ where: { userId: USER_ID }, include: { category: true } }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId: USER_ID, type: 'EXPENSE', status: 'COMPLETED', date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      this.prisma.category.findMany({ where: { userId: USER_ID, type: 'EXPENSE' } }),
    ]);
    const spentBy = new Map(spentRows.map((r) => [r.categoryId, toCents(r._sum.amount)]));

    let limitTotal = 0;
    let spentTotal = 0;
    const items = budgets
      .map((b) => {
        const limit = toCents(b.amount);
        const spent = spentBy.get(b.categoryId) ?? 0;
        limitTotal += limit;
        spentTotal += spent;
        const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const status = pct > 100 ? 'OVER' : pct > pacePct + 10 ? 'AHEAD' : 'OK';
        return {
          id: b.id,
          category: { id: b.category.id, name: b.category.name, color: b.category.color },
          limit: fromCents(limit),
          spent: fromCents(spent),
          remaining: fromCents(limit - spent),
          pct,
          status,
          perDayLeft: fromCents(Math.max(0, Math.floor((limit - spent) / daysLeft))),
        };
      })
      .sort((a, b) => b.pct - a.pct);

    const budgeted = new Set(budgets.map((b) => b.categoryId));
    const unbudgeted = categories
      .filter((c) => !budgeted.has(c.id) && (spentBy.get(c.id) ?? 0) > 0)
      .map((c) => ({ category: { id: c.id, name: c.name, color: c.color }, spent: fromCents(spentBy.get(c.id) ?? 0) }))
      .sort((a, b) => b.spent - a.spent);

    return {
      month: key,
      pacePct,
      daysLeft,
      totals: {
        limit: fromCents(limitTotal),
        spent: fromCents(spentTotal),
        remaining: fromCents(limitTotal - spentTotal),
        pct: limitTotal > 0 ? Math.round((spentTotal / limitTotal) * 100) : 0,
      },
      items,
      unbudgeted,
    };
  }
}
