import { IsNumber, IsOptional, IsString, IsBoolean, IsUUID, IsDateString } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  amount: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  alertAt80?: boolean;

  @IsOptional()
  @IsBoolean()
  alertAt100?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
