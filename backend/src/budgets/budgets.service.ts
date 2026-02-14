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
        ...dto,
        userId: USER_ID,
        amount: new Decimal(dto.amount),
        period: dto.period ?? 'MONTHLY',
      },
    });
  }

  findAll() {
    return this.prisma.budget.findMany({
      where: { userId: USER_ID },
      include: { category: true },
      orderBy: { startDate: 'desc' },
    });
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
    return this.prisma.budget.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.budget.delete({ where: { id } });
  }
}
