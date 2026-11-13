import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RecurringExpensesService } from './recurring-expenses.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { PayBillDto, UndoBillDto } from './dto/link-bill.dto';

@Controller('recurring-expenses')
export class RecurringExpensesController {
  constructor(private readonly service: RecurringExpensesService) {}

  @Post()
  create(@Body() dto: CreateRecurringExpenseDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('type') type?: string, @Query('status') status?: string, @Query('today') today?: string) {
    return this.service.findAll(type, status, today);
  }

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  /** Tudo que vence no mês: compromissos, parcelas agendadas e faturas de cartão. */
  @Get('bills/:month')
  getBills(@Param('month') month: string, @Query('today') today?: string) {
    return this.service.getBills(month, today);
  }

  @Get(':id/candidates')
  findCandidates(@Param('id') id: string, @Query('month') month: string) {
    return this.service.findCandidates(id, month);
  }

  @Post(':id/pay')
  pay(@Param('id') id: string, @Body() dto: PayBillDto) {
    return this.service.payBill(id, dto);
  }

  @Post(':id/undo-pay')
  undoPay(@Param('id') id: string, @Body() dto: UndoBillDto) {
    return this.service.undoPayBill(id, dto.month);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecurringExpenseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
