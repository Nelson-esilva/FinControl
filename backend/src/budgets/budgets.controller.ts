import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Post()
  create(@Body() dto: CreateBudgetDto) {
    return this.budgets.create(dto);
  }

  @Get()
  findAll() {
    return this.budgets.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgets.findOne(id);
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
