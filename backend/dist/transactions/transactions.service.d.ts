import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType } from '@prisma/client';
export declare class TransactionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTransactionDto): unknown;
    findAll(filters?: {
        type?: TransactionType;
        accountId?: string;
        categoryId?: string;
        from?: string;
        to?: string;
    }): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateTransactionDto): unknown;
    remove(id: string): unknown;
}
