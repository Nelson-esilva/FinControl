import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { TransactionsService, TransactionFilters } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactions.create(dto);
  }

  @Get()
  findAll(@Query() query: TransactionFilters) {
    return this.transactions.findAll(query);
  }

  @Get('tags')
  tags() {
    return this.transactions.listTags();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactions.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactions.update(id, dto);
  }

  @Patch(':id/pay')
  pay(@Param('id') id: string) {
    return this.transactions.pay(id);
  }

  @Patch(':id/unpay')
  unpay(@Param('id') id: string) {
    return this.transactions.unpay(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('scope') scope?: string) {
    return this.transactions.remove(id, scope === 'all' ? 'all' : 'one');
  }
}
