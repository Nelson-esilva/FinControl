import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDto } from './create-budget.dto';

export class UpdateBudgetDto extends PartialType(OmitType(CreateBudgetDto, ['categoryId'] as const)) {}
