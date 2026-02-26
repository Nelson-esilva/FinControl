import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { RecurringExpensesModule } from './recurring-expenses/recurring-expenses.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    UploadModule,
    AuthModule,
    DashboardModule,
    UsersModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    NotificationsModule,
    AttachmentsModule,
    RecurringExpensesModule,
  ],
  controllers: [HealthController],
})
export class AppModule { }
