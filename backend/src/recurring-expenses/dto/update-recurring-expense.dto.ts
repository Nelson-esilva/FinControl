import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateRecurringExpenseDto } from './create-recurring-expense.dto';

enum RecurringStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export class UpdateRecurringExpenseDto extends PartialType(CreateRecurringExpenseDto) {
    @IsOptional()
    @IsEnum(RecurringStatus)
    status?: RecurringStatus;
}
