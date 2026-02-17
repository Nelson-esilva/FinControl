import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Decimal } from '@prisma/client/runtime/library';

const USER_ID = 'user-id';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        userId: USER_ID,
        categoryId: dto.categoryId,
        amount: new Decimal(dto.amount),
        period: dto.period ?? 'MONTHLY',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        alertAt80: dto.alertAt80 ?? true,
        alertAt100: dto.alertAt100 ?? true,
        isActive: dto.isActive ?? true,
      },
      include: { category: true },
    });
  }

  async findAll() {
    const budgets = await this.prisma.budget.findMany({
      where: { userId: USER_ID },
      include: { category: true },
      orderBy: { startDate: 'desc' },
    });
    const withSpent = await Promise.all(
      budgets.map(async (b: (typeof budgets)[number]) => {
        const sum = await this.prisma.transaction.aggregate({
          where: {
            userId: USER_ID,
            categoryId: b.categoryId,
            type: 'EXPENSE',
            date: { gte: b.startDate, lte: b.endDate },
          },
          _sum: { amount: true },
        });
        const spent = Number(sum._sum.amount ?? 0);
        return { ...b, spent };
      }),
    );
    return withSpent;
  }

  findOne(id: string) {
    return this.prisma.budget.findFirstOrThrow({
      where: { id, userId: USER_ID },
      include: { category: true },
    });
  }

  update(id: string, dto: UpdateBudgetDto) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.amount != null) data.amount = new Decimal(dto.amount);
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.budget.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  remove(id: string) {
    return this.prisma.budget.delete({ where: { id } });
  }
}
