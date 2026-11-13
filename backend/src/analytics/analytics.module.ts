import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { RecurringExpensesModule } from '../recurring-expenses/recurring-expenses.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [AccountsModule, RecurringExpensesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
