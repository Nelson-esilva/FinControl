import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';

/** Parcelamento não é editável depois de criado: apague e recrie. */
export class UpdateTransactionDto extends PartialType(OmitType(CreateTransactionDto, ['totalInstallments'] as const)) {}
