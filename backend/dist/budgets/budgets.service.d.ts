import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Decimal } from '@prisma/client/runtime/library';
export declare class BudgetsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateBudgetDto): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        userId: string;
        amount: Decimal;
        categoryId: string;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TransactionType;
            color: string;
            icon: string;
            userId: string;
            isDefault: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        userId: string;
        amount: Decimal;
        categoryId: string;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        category: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TransactionType;
            color: string;
            icon: string;
            userId: string;
            isDefault: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        userId: string;
        amount: Decimal;
        categoryId: string;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateBudgetDto): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        userId: string;
        amount: Decimal;
        categoryId: string;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        userId: string;
        amount: Decimal;
        categoryId: string;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
