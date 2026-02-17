import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Decimal } from '@prisma/client/runtime/library';
export declare class BudgetsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateBudgetDto): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            name: string;
            type: import(".prisma/client").$Enums.TransactionType;
            color: string;
            icon: string;
            isDefault: boolean;
        };
    } & {
        id: string;
        amount: Decimal;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        categoryId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findAll(): Promise<{
        spent: number;
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            name: string;
            type: import(".prisma/client").$Enums.TransactionType;
            color: string;
            icon: string;
            isDefault: boolean;
        };
        id: string;
        amount: Decimal;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        categoryId: string;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            name: string;
            type: import(".prisma/client").$Enums.TransactionType;
            color: string;
            icon: string;
            isDefault: boolean;
        };
    } & {
        id: string;
        amount: Decimal;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        categoryId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateBudgetDto): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            name: string;
            type: import(".prisma/client").$Enums.TransactionType;
            color: string;
            icon: string;
            isDefault: boolean;
        };
    } & {
        id: string;
        amount: Decimal;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        categoryId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        id: string;
        amount: Decimal;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        categoryId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
