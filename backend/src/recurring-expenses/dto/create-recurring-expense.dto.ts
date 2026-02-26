import { IsString, IsOptional, IsNumber, IsEnum, IsInt, IsDateString, Min, Max } from 'class-validator';

enum RecurringType {
    FIXED = 'FIXED',
    INSTALLMENT = 'INSTALLMENT',
    CREDIT_CARD = 'CREDIT_CARD',
    LOAN = 'LOAN',
    SUBSCRIPTION = 'SUBSCRIPTION',
}

enum RecurringFrequency {
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
}

export class CreateRecurringExpenseDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(RecurringType)
    type: RecurringType;

    @IsNumber()
    amount: number;

    @IsOptional()
    @IsEnum(RecurringFrequency)
    frequency?: RecurringFrequency;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(31)
    dueDay?: number;

    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    currentInstallment?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    totalInstallments?: number;

    @IsOptional()
    @IsNumber()
    interestRate?: number;

    @IsOptional()
    @IsString()
    cardName?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    accountId?: string;
}
