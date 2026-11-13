import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'PAYMENT'] as const;
export const TRANSACTION_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED', 'SCHEDULED'] as const;
export const NATURES = ['ESSENTIAL', 'IMPORTANT', 'SUPERFLUOUS'] as const;

export class CreateTransactionDto {
  /** Valor total. Com parcelas, é dividido entre elas (centavos extras na 1ª). */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsDateString()
  date: string;

  @IsString()
  @MaxLength(200)
  description: string;

  @IsIn(TRANSACTION_TYPES)
  type: (typeof TRANSACTION_TYPES)[number];

  @IsOptional()
  @IsIn(TRANSACTION_STATUSES)
  status?: (typeof TRANSACTION_STATUSES)[number];

  @IsUUID()
  accountId: string;

  /** Obrigatório em PAYMENT: conta que recebe (cartão, investimento, outra conta). */
  @IsOptional()
  @IsUUID()
  transferAccountId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsIn(NATURES)
  nature?: (typeof NATURES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  totalInstallments?: number;

  /** PAYMENT para cartão: qual fatura (mês de fechamento) está sendo paga. */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  invoiceMonth?: string;
}
