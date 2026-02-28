import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) { }

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactions.create(dto);
  }

  @Get()
  findAll(
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('parentTransactionId') parentTransactionId?: string,
    @Query('accountId') accountId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.transactions.findAll({ type, status, parentTransactionId, accountId, categoryId, from, to });
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactions.remove(id);
  }
}
