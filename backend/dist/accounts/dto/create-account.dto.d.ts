import { AccountType } from '@prisma/client';
export declare class CreateAccountDto {
    name: string;
    type: AccountType;
    initialBalance?: number;
    creditLimit?: number;
    dueDate?: number;
    color?: string;
    icon?: string;
    isActive?: boolean;
}
