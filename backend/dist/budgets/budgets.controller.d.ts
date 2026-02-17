import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetsController {
    private readonly budgets;
    constructor(budgets: BudgetsService);
    create(dto: CreateBudgetDto): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        category: {
            id: string;
            name: string;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        categoryId: string;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findAll(): Promise<{
        spent: number;
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TransactionType;
            color: string;
            icon: string;
            userId: string;
            isDefault: boolean;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        categoryId: string;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        category: {
            id: string;
            name: string;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        categoryId: string;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateBudgetDto): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        category: {
            id: string;
            name: string;
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
        amount: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        categoryId: string;
        period: string;
        startDate: Date;
        endDate: Date;
        alertAt80: boolean;
        alertAt100: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
