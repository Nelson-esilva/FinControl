import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateRecurringExpenseDto } from './create-recurring-expense.dto';

export class UpdateRecurringExpenseDto extends PartialType(CreateRecurringExpenseDto) {
  @IsOptional()
  @IsIn(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
}
