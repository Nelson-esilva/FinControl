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
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const USER_ID = 'user-id';
let BudgetsService = class BudgetsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(dto) {
        return this.prisma.budget.create({
            data: {
                userId: USER_ID,
                categoryId: dto.categoryId,
                amount: new library_1.Decimal(dto.amount),
                period: dto.period ?? 'MONTHLY',
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                alertAt80: dto.alertAt80 ?? true,
                alertAt100: dto.alertAt100 ?? true,
                isActive: dto.isActive ?? true,
            },
            include: { category: true },
        });
    }
    async findAll() {
        const budgets = await this.prisma.budget.findMany({
            where: { userId: USER_ID },
            include: { category: true },
            orderBy: { startDate: 'desc' },
        });
        const withSpent = await Promise.all(budgets.map(async (b) => {
            const sum = await this.prisma.transaction.aggregate({
                where: {
                    userId: USER_ID,
                    categoryId: b.categoryId,
                    type: 'EXPENSE',
                    date: { gte: b.startDate, lte: b.endDate },
                },
                _sum: { amount: true },
            });
            const spent = Number(sum._sum.amount ?? 0);
            return { ...b, spent };
        }));
        return withSpent;
    }
    findOne(id) {
        return this.prisma.budget.findFirstOrThrow({
            where: { id, userId: USER_ID },
            include: { category: true },
        });
    }
    update(id, dto) {
        const data = { ...dto };
        if (dto.amount != null)
            data.amount = new library_1.Decimal(dto.amount);
        if (dto.startDate)
            data.startDate = new Date(dto.startDate);
        if (dto.endDate)
            data.endDate = new Date(dto.endDate);
        return this.prisma.budget.update({
            where: { id },
            data,
            include: { category: true },
        });
    }
    remove(id) {
        return this.prisma.budget.delete({ where: { id } });
    }
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map