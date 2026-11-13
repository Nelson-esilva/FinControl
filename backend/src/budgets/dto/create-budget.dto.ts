import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

/** Limite mensal da categoria (vale para todos os meses). */
export class CreateBudgetDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  alertAt80?: boolean;

  @IsOptional()
  @IsBoolean()
  alertAt100?: boolean;
}
