import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export const RECURRING_TYPES = ['FIXED', 'SUBSCRIPTION', 'INSTALLMENT', 'LOAN', 'INCOME'] as const;
export const RECURRING_FREQUENCIES = ['WEEKLY', 'MONTHLY', 'YEARLY'] as const;

export class CreateRecurringExpenseDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsIn(RECURRING_TYPES)
  type: (typeof RECURRING_TYPES)[number];

  /** Valor de cada ocorrência (parcela, mensalidade, salário). */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsIn(RECURRING_FREQUENCIES)
  frequency?: (typeof RECURRING_FREQUENCIES)[number];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  /** Parcela que vence no mês de início (ex.: cadastro na 23ª de 48). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  firstInstallment?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  totalInstallments?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  interestRate?: number | null;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsUUID()
  accountId?: string | null;
}
