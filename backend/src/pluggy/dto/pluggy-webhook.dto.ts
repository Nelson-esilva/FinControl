import { IsArray, IsOptional, IsString } from 'class-validator';

export class PluggyWebhookDto {
  @IsString()
  event: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  transactionIds?: string[];

  @IsOptional()
  @IsString()
  createdTransactionsLink?: string;

  @IsOptional()
  @IsString()
  createdTransactionsLinkV2?: string;
}
