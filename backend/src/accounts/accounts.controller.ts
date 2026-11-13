import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateValuationDto } from './dto/create-valuation.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accounts.create(dto);
  }

  /** Contas com saldo, fatura aberta (cartão) e rendimento (investimento). */
  @Get()
  findAll(@Query('today') today?: string) {
    return this.accounts.summaries(today);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accounts.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accounts.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accounts.remove(id);
  }

  @Get(':id/valuations')
  valuations(@Param('id') id: string) {
    return this.accounts.listValuations(id);
  }

  @Post(':id/valuations')
  addValuation(@Param('id') id: string, @Body() dto: CreateValuationDto) {
    return this.accounts.addValuation(id, dto);
  }

  @Get(':id/invoices/:month')
  invoice(@Param('id') id: string, @Param('month') month: string) {
    return this.accounts.invoiceDetail(id, month);
  }
}
