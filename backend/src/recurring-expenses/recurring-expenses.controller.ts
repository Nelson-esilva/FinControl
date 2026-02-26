import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RecurringExpensesService } from './recurring-expenses.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';

@Controller('recurring-expenses')
export class RecurringExpensesController {
    constructor(private readonly service: RecurringExpensesService) { }

    @Post()
    create(@Body() dto: CreateRecurringExpenseDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('type') type?: string, @Query('status') status?: string) {
        return this.service.findAll(type, status);
    }

    @Get('summary')
    getSummary() {
        return this.service.getSummary();
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
