import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getData(): Promise<{
        totalBalance: number;
        monthlyIncome: number;
        monthlyExpense: number;
        monthlyBalance: number;
        recentTransactions: {
            id: string;
            description: string;
            category: string;
            categoryColor: string;
            account: string;
            date: Date;
            amount: number;
            type: string;
        }[];
        categorySummary: {
            name: string;
            value: number;
            color: string;
        }[];
    }>;
}
