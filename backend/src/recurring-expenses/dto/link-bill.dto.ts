import { IsOptional, IsString, Matches } from 'class-validator';

export class LinkBillDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;
}

export class UndoBillLinkDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month: string;
}
