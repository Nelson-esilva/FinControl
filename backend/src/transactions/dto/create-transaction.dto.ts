import { IsEnum, IsNumber, IsOptional, IsString, IsBoolean, IsUUID, IsDateString } from 'class-validator';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsString()
  description: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

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
}
