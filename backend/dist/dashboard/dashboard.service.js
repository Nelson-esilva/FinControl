"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const USER_ID = 'user-id';
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getData() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const [accounts, transactions, recentTransactions, previousMonthCount, budgets] = await Promise.all([
            this.prisma.account.findMany({
                where: { userId: USER_ID, isActive: true },
            }),
            this.prisma.transaction.findMany({
                where: {
                    userId: USER_ID,
                    date: { gte: startOfMonth, lte: endOfMonth },
                    status: 'COMPLETED',
                },
                include: { category: true },
            }),
            this.prisma.transaction.findMany({
                where: { userId: USER_ID },
                include: { account: true, category: true },
                orderBy: { date: 'desc' },
                take: 10,
            }),
            this.prisma.transaction.count({
                where: {
                    userId: USER_ID,
                    date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
                    status: 'COMPLETED',
                },
            }),
            this.prisma.budget.findMany({
                where: {
                    userId: USER_ID,
                    isActive: true,
                    startDate: { lte: endOfMonth },
                    endDate: { gte: startOfMonth },
                },
            }),
        ]);
        const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);
        const monthlyIncome = transactions
            .filter((t) => t.type === client_1.TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const monthlyExpense = transactions
            .filter((t) => t.type === client_1.TransactionType.EXPENSE)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const categoryMap = new Map();
        transactions
            .filter((t) => t.type === client_1.TransactionType.EXPENSE)
            .forEach((t) => {
            const key = t.categoryId;
            const cur = categoryMap.get(key) ?? {
                name: t.category.name,
                value: 0,
                color: t.category.color ?? '#6366f1',
            };
            cur.value += Number(t.amount);
            categoryMap.set(key, cur);
        });
        const categorySummary = Array.from(categoryMap.values());
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const last12MonthsTxs = await this.prisma.transaction.findMany({
            where: { userId: USER_ID, date: { gte: twelveMonthsAgo }, status: 'COMPLETED' },
        });
        const byMonth = new Map();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            byMonth.set(key, { income: 0, expense: 0 });
        }
        last12MonthsTxs.forEach((t) => {
            const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
            const cur = byMonth.get(key);
            if (cur) {
                if (t.type === client_1.TransactionType.INCOME)
                    cur.income += Number(t.amount);
                else
                    cur.expense += Number(t.amount);
            }
        });
        const monthlySummary = Array.from(byMonth.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v], idx) => {
            const d = new Date(now.getFullYear(), now.getMonth() - 11 + idx, 1);
            return {
                month: monthNames[d.getMonth()],
                income: v.income,
                expense: v.expense,
                balance: v.income - v.expense,
            };
        });
        const monthlyBalance = monthlyIncome - monthlyExpense;
        const savingsGoalPercent = 20;
        const savingsGoalPlanned = (monthlyIncome * savingsGoalPercent) / 100;
        const savingsGoalAchievedPercent = savingsGoalPlanned > 0 ? Math.min(100, (monthlyBalance / savingsGoalPlanned) * 100) : 0;
        const totalBudgetLimit = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
        const spendingLimitUsedPercent = totalBudgetLimit > 0 ? Math.min(100, (monthlyExpense / totalBudgetLimit) * 100) : 0;
        const accountTypeCount = accounts.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] ?? 0) + 1;
            return acc;
        }, {});
        return {
            totalBalance,
            monthlyIncome,
            monthlyExpense,
            monthlyBalance,
            monthlyTransactionCount: transactions.length,
            previousMonthTransactionCount: previousMonthCount,
            activeAccountsCount: accounts.length,
            activeAccountsByType: accountTypeCount,
            savingsGoalPlanned,
            savingsGoalAchievedPercent,
            totalBudgetLimit,
            spendingLimitUsedPercent,
            monthlySummary,
            recentTransactions: recentTransactions.map((t) => ({
                id: t.id,
                description: t.description,
                category: t.category.name,
                categoryColor: t.category.color,
                account: t.account.name,
                date: t.date,
                amount: Number(t.amount) * (t.type === client_1.TransactionType.INCOME ? 1 : -1),
                type: t.type.toLowerCase(),
            })),
            categorySummary,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map