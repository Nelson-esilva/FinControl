import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboard;
    constructor(dashboard: DashboardService);
    getData(): Promise<{
        totalBalance: number;
        monthlyIncome: number;
        monthlyExpense: number;
        monthlyBalance: number;
        monthlySummary: {
            month: string;
            income: number;
            expense: number;
            balance: number;
        }[];
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
