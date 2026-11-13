import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  /** Cria ou substitui o limite da categoria. */
  @Post()
  upsert(@Body() dto: CreateBudgetDto) {
    return this.budgets.upsert(dto);
  }

  /** Orçamento do mês: gasto, % e ritmo por categoria. */
  @Get()
  month(@Query('month') month?: string, @Query('today') today?: string) {
    return this.budgets.forMonth(month, today);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgets.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.budgets.remove(id);
  }
}
