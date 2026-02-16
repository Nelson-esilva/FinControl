import { TransactionType, TransactionStatus } from '@prisma/client';
export declare class CreateTransactionDto {
    amount: number;
    date: string;
    description: string;
    type: TransactionType;
    status?: TransactionStatus;
    accountId: string;
    categoryId: string;
    installmentNumber?: number;
    totalInstallments?: number;
    isRecurring?: boolean;
    recurringFrequency?: string;
}
