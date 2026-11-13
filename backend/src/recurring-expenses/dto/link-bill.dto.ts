import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsUUID, Matches } from 'class-validator';

export class PayBillDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;

  /** Vincular a uma linha já existente do extrato (Pluggy) em vez de criar lançamento. */
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  /** Conta que pagou/recebeu. Padrão: a conta do compromisso. */
  @IsOptional()
  @IsUUID()
  accountId?: string;

  /** Valor efetivamente pago (padrão: valor do compromisso). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class UndoBillDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;
}
