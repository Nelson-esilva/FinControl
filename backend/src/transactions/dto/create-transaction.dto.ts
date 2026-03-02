import { IsNumber, IsOptional, IsString, IsBoolean, IsUUID, IsDateString, IsIn } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsString()
  description: string;

  @IsString()
  @IsIn(['INCOME', 'EXPENSE', 'PAYMENT'])
  type: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'COMPLETED', 'CANCELLED', 'SCHEDULED'])
  status?: string;

  @IsUUID()
  accountId: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsNumber()
  installmentNumber?: number;

  @IsOptional()
  @IsNumber()
  totalInstallments?: number;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurringFrequency?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
