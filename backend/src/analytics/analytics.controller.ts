import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService, SpendingGroupBy, SPENDING_GROUPS } from './analytics.service';
import { BadRequestException } from '@nestjs/common';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** Livre para gastar, KPIs do mês, próximos vencimentos, top categorias e recentes. */
  @Get('overview')
  overview(@Query('month') month?: string, @Query('today') today?: string) {
    return this.analytics.overview(month, today);
  }

  /** Onde / quando / por quê: gasto agrupado. Exclui transferências (PAYMENT). */
  @Get('spending')
  spending(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy: string = 'category',
    @Query('compare') compare?: string,
  ) {
    if (!SPENDING_GROUPS.includes(groupBy as SpendingGroupBy)) {
      throw new BadRequestException(`groupBy deve ser um de: ${SPENDING_GROUPS.join(', ')}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(to ?? '')) {
      throw new BadRequestException('Informe from e to no formato YYYY-MM-DD.');
    }
    return this.analytics.spending(from, to, groupBy as SpendingGroupBy, compare === '1');
  }

  @Get('cashflow')
  cashflow(@Query('months') months?: string, @Query('today') today?: string) {
    return this.analytics.cashflow(clampMonths(months), today);
  }

  @Get('net-worth')
  netWorth(@Query('months') months?: string, @Query('today') today?: string) {
    return this.analytics.netWorthSeries(clampMonths(months), today);
  }
}

function clampMonths(value?: string) {
  const n = Number(value) || 12;
  return Math.min(Math.max(n, 1), 36);
}
