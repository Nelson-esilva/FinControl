import { IsString, Matches } from 'class-validator';

export class LinkBillDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month: string;

  @IsString()
  transactionId: string;
}

export class UndoBillLinkDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month: string;
}
